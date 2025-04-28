const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// --- CONFIGURATION ---
const RPC_URL = "http://localhost:8545";
const CONTRACT_JSON_PATH = "client-ledger/artifacts/contracts/MpcSession.json";
const MPC_RESULT_PATH = "../../MP-SPDZ/mpc-results/party0_aml_result.json";

// --- HELPERS ---
async function loadContract(bankIndex) {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const signer = provider.getSigner(bankIndex);

    const artifact = JSON.parse(fs.readFileSync(CONTRACT_JSON_PATH));
    const contract = new ethers.Contract(artifact.address, artifact.abi, signer);

    return { contract, signer };
}

// --- Parse flags ---
function parseArgs() {
    const args = process.argv.slice(2);

    const options = {
        action: null,
        sessionId: null,
    };

    if (args.length === 0) {
        console.error("Usage: node interactMpc.js <action> [--session <sessionId>]");
        process.exit(1);
    }

    options.action = args[0];

    for (let i = 1; i < args.length; i++) {
        if (args[i] === "--session") {
            options.sessionId = parseInt(args[i + 1]);
            i++;
        }
    }

    return options;
}

// --- MAIN ---
async function main() {
    const { action, sessionId } = parseArgs();

    // Load bank identity
    const bankIndex = parseInt(process.env.BANK_INDEX);
    if (isNaN(bankIndex)) {
        console.error("Missing BANK_INDEX environment variable!");
        console.error("Set it first: export BANK_INDEX=0");
        process.exit(1);
    }
    console.log(`Bank Index: ${bankIndex}`);

    const { contract } = await loadContract(bankIndex);

    if (action === "createSession") {
        const clientId = "1488"; // placeholder

        const tx = await contract.createSession(clientId);
        await tx.wait();
        console.log("Session created successfully.");

    } else if (action === "joinSession") {
        if (sessionId === null) {
            console.error("joinSession requires --session <sessionId>");
            process.exit(1);
        }
        const tx = await contract.joinSession(sessionId);
        await tx.wait();
        console.log(`Joined session ${sessionId}.`);

    } else if (action === "startSession") {
        if (sessionId === null) {
            console.error("startSession requires --session <sessionId>");
            process.exit(1);
        }
        const tx = await contract.startSession(sessionId);
        await tx.wait();
        console.log(`Started session ${sessionId}.`);

    } else if (action === "finishSession") {
        if (sessionId === null) {
            console.error("finishSession requires --session <sessionId>");
            process.exit(1);
        }
        
        const resultPath = path.join(__dirname, MPC_RESULT_PATH);
        let fin;
        try {
            const resultJson = JSON.parse(fs.readFileSync(resultPath, "utf8"));
            if (!("fin" in resultJson)) {
                console.error("MPC result file missing 'fin' field.");
                process.exit(1);
            }
            fin = resultJson.fin;
        } catch (err) {
            console.error("Error reading MPC result file:", err.message);
            process.exit(1);
        }

        const finScaled = Math.round(fin * 1e6);
        const finHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(["uint256"], [finScaled])
        );

        console.log(`Read fin=${fin}, finScaled=${finScaled} finHash=${finHash}`);

        const tx = await contract.finishSession(sessionId, finHash);
        await tx.wait();
        console.log(`Finished session ${sessionId} with finHash ${finHash}`);


    } else if (action === "abortSession") {
        if (sessionId === null) {
            console.error("abortSession requires --session <sessionId>");
            process.exit(1);
        }
        const tx = await contract.abortSession(sessionId);
        await tx.wait();
        console.log(`Aborted session ${sessionId}.`);

    } else if (action === "getSessionParticipants") {
        if (sessionId === null) {
            console.error("getSessionParticipants requires --session <sessionId>");
            process.exit(1);
        }
        const participants = await contract.getSessionParticipants(sessionId);
        console.log(`Participants in session ${sessionId}:`, participants);

    } else if (action === "getSessionStatus") {
        if (sessionId === null) {
            console.error("getSessionStatus requires --session <sessionId>");
            process.exit(1);
        }
        const status = await contract.getSessionStatus(sessionId);
        console.log(`Status of session ${sessionId}: ${status}`);

    } else {
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});

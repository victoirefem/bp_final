const { ethers } = require("ethers");
const fs = require("fs");

const RPC_URL = "http://localhost:8545";
const CONTRACT_JSON_PATH = "artifacts/contracts/MpcSession.json";

// Mapping status numbers to readable text
const SESSION_STATUS = {
    0: "Created",
    1: "Active",
    2: "Finished",
    3: "Aborted"
};

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error("Usage: node inspectMpc.js --session <sessionId>");
        process.exit(1);
    }

    let sessionId = null;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--session") {
            sessionId = parseInt(args[i + 1]);
            break;
        }
    }

    if (sessionId === null) {
        console.error("Missing --session <sessionId> argument!");
        process.exit(1);
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const artifact = JSON.parse(fs.readFileSync(CONTRACT_JSON_PATH));
    const contract = new ethers.Contract(artifact.address, artifact.abi, provider);

    try {
        const status = await contract.getSessionStatus(sessionId);
        const participants = await contract.getSessionParticipants(sessionId);
        const clientId = await contract.getSessionClientId(sessionId);
        let finHash = "N/A";

        try {
            finHash = await contract.getSessionFinHash(sessionId);
        } catch (e) {
            finHash = "Session not finished yet";
        }

        console.log(`Session ID: ${sessionId}`);
        console.log(`Client ID: ${clientId}`);
        console.log(`Status: ${SESSION_STATUS[status] || "Unknown"}`);
        console.log(`Participants: ${participants}`);
        console.log(`Fin Hash: ${finHash}`);
    } catch (err) {
        console.error(`Error reading session ${sessionId}:`, err.message);
    }
}

main().catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
});

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// === CONFIG ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

const ssnClient = "1488";  // for client commitments
const ssnPRF = "prf";      // special key for p(rf)
const month = 202504;

// === UTILS ===
function loadJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
    const bankId = parseInt(process.argv[2], 10);
    const mode = process.argv[3] || "client";  // default: client

    if (isNaN(bankId)) {
        console.error("provide a valid bank ID");
        return;
    }

    const signer = provider.getSigner(bankId);
    const signerAddress = await signer.getAddress();

    const contractMeta = loadJSON("artifacts/contracts/ClientLedger.json");
    const contract = new ethers.Contract(contractMeta.address, contractMeta.abi, signer);

    const profilesDir = path.join("data", `bank${bankId}`, "profiles");

    if (mode === "client") {
        const profilePath = path.join(profilesDir, `${ssnClient}_${month}.json`);
        if (!fs.existsSync(profilePath)) {
            console.error(`Client profile not found: ${profilePath}`);
            return;
        }

        const { staticHash, txHash } = loadJSON(profilePath);

        console.log(`[Client] Committing static and tx hashes for bank ${bankId} (${signerAddress})`);

        const tx1 = await contract.commitStatic(staticHash, month, "Static commitment");
        await tx1.wait();
        console.log("Static profile committed");

        const tx2 = await contract.commitTx(txHash, month, "TX commitment");
        await tx2.wait();
        console.log("TX profile committed");

    } else if (mode === "prf") {
        const profilePath = path.join(profilesDir, `${ssnPRF}_${month}.json`);
        if (!fs.existsSync(profilePath)) {
            console.error(`PRF profile not found: ${profilePath}`);
            return;
        }

        const { prfHash } = loadJSON(profilePath);

        console.log(`[PRF] Committing p(rf) hash for bank ${bankId} (${signerAddress})`);

        const rf = await contract.commitRF(prfHash, month, "PRF commitment");
        await rf.wait();
        console.log("PRF commitment submitted ✔️");

    } else {
        console.error("Invalid mode. Use 'client' or 'prf'.");
        return;
    }
}

main().catch(console.error);

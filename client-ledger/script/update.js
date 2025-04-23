const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// === CONFIG ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

const ssnClient = "1488";
const ssnPRF = "prf";
const month = 202504;

// === UTILS ===
function loadJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
    const bankId = parseInt(process.argv[2], 10);
    const mode = process.argv[3] || "client"; // default: client

    if (isNaN(bankId)) {
        console.error("Please provide a valid bank ID");
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
        console.log(`[Client] Updating static and tx commitments for Bank ${bankId} (${signerAddress})`);

        try {
            const tx1 = await contract.updateStatic(staticHash, month, "Updated static commitment");
            await tx1.wait();
            console.log("Static commitment updated");
        } catch (err) {
            console.error("Failed to update static commitment:", err.message);
        }

        try {
            const tx2 = await contract.updateTx(txHash, month, "Updated tx commitment");
            await tx2.wait();
            console.log("TX commitment updated");
        } catch (err) {
            console.error("Failed to update tx commitment:", err.message);
        }

    } else if (mode === "prf") {
        const profilePath = path.join(profilesDir, `${ssnPRF}_${month}.json`);
        if (!fs.existsSync(profilePath)) {
            console.error(`PRF profile not found: ${profilePath}`);
            return;
        }

        const { prfHash } = loadJSON(profilePath);
        console.log(`[PRF] Updating p(rf) commitment for Bank ${bankId} (${signerAddress})`);

        try {
            const tx = await contract.updateRF(prfHash, month, "Updated PRF commitment");
            await tx.wait();
            console.log("PRF commitment updated");
        } catch (err) {
            console.error("Failed to update PRF commitment:", err.message);
        }

    } else {
        console.error("Invalid mode. Use 'client' or 'prf'.");
    }
}

main().catch(console.error);

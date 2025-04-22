const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// === CONFIG ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signerIndex = 2;  // Change to target a different bank
const ssn = "1488";
const month = 202504;

async function main() {
    const signer = provider.getSigner(signerIndex);
    const signerAddress = await signer.getAddress();

    // Load contract ABI and address
    const contractMeta = JSON.parse(fs.readFileSync("artifacts/contracts/ClientLedger.json", "utf8"));
    const contract = new ethers.Contract(contractMeta.address, contractMeta.abi, signer);

    // Load pregenerated profile hashes
    const profilePath = path.join("data", `bank${signerIndex}`, "profiles", `${ssn}_${month}.json`);
    if (!fs.existsSync(profilePath)) {
        console.error("❌ Profile hash not found at:", profilePath);
        return;
    }

    const { staticHash, txHash } = JSON.parse(fs.readFileSync(profilePath, "utf8"));

    console.log(`🛠️  Updating commitments for Bank ${signerIndex} (${signerAddress})`);
    console.log("• New Static Hash:", staticHash);
    console.log("• New TX Hash:    ", txHash);

    try {
        const tx1 = await contract.updateStatic(staticHash, month, "Updated static commitment");
        await tx1.wait();
        console.log("✅ Static commitment updated");
    } catch (err) {
        console.error("❌ Failed to update static commitment:", err.message);
    }

    try {
        const tx2 = await contract.updateTx(txHash, month, "Updated tx commitment");
        await tx2.wait();
        console.log("✅ TX commitment updated");
    } catch (err) {
        console.error("❌ Failed to update tx commitment:", err.message);
    }
}

main().catch(console.error);

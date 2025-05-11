const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Hardcoded input file ===
const bankId = "20";
const inputFile = path.join("bank_data", "hashed-for-proofs", `${bankId}_proofs.json`);

if (!fs.existsSync(inputFile)) {
  console.error(`Transaction hash file not found: ${inputFile}`);
  process.exit(1);
}
const transactions = JSON.parse(fs.readFileSync(inputFile));

// === Use Anvil's signer at index 0 ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(0);

// === Load contract ===
const { abi, address } = require("../artifacts/contracts/TxLedger.json");
const contract = new ethers.Contract(address, abi, signer);

// === Submit all hashes ===
async function run() {
  for (const { hash } of transactions) {
    try {
      const tx = await contract.recordTransaction(hash);
      await tx.wait();
      console.log(`Recorded: ${hash}`);
    } catch (err) {
      console.error(`Failed to record hash ${hash}:`, err.reason || err.message);
    }
  }
}

run().catch((err) => {
  console.error("Error in recordForProofs:", err);
  process.exit(1);
});

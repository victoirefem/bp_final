const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Get bankId and clientId from CLI ===
const bankId = process.argv[2];
const clientId = process.argv[3];

if (!bankId || !clientId) {
  console.error("Usage: node blockchain/scripts/recordTransactions.js <bankid> <clientid>");
  process.exit(1);
}

// === Load transactions for the given bank and client ===
const dataFile = path.join("bank_data", "clients", `${bankId}_${clientId}_incomes.json`);
if (!fs.existsSync(dataFile)) {
  console.error(`File not found: ${dataFile}`);
  process.exit(1);
}

const transactions = JSON.parse(fs.readFileSync(dataFile));

// === Set up blockchain connection ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(0);

// === Load contract ABI and address ===
const { abi, address } = require("../artifacts/contracts/TxLedger.json");
const contract = new ethers.Contract(address, abi, signer);

// === Record all hashes on-chain ===
async function recordAll() {
  for (const { hash } of transactions) {
    console.log(`Recording hash: ${hash}`);
    try {
      const tx = await contract.recordTransaction(hash);
      await tx.wait();
      console.log(`Transaction confirmed.`);
    } catch (err) {
      console.error(`Failed to record hash ${hash}:`, err);
    }
  }

  console.log("All transactions recorded.");
}

recordAll().catch((err) => {
  console.error("Error recording transactions:", err);
  process.exit(1);
});

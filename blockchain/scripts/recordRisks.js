const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// Args
const bankId = process.argv[2];
const clientId = process.argv[3];
const privateKey = process.argv[4];

if (!bankId || !clientId || !privateKey) {
  console.error("Usage: node blockchain/scripts/recordRisks.js <bankId> <clientId> <privateKey>");
  process.exit(1);
}

// Load bank addresses
const addressMap = JSON.parse(fs.readFileSync("bank_data/wallets/bank_address_map.json", "utf8"));
const bankAddress = addressMap[bankId];

if (!bankAddress) {
  console.error(`Bank address not found for bank ID: ${bankId}`);
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = new ethers.Wallet(privateKey, provider);

const { abi, address } = require("../artifacts/contracts/RiskLedger.json");
const contract = new ethers.Contract(address, abi, signer);

// === Load risk file ===
const filePath = path.join("bank_data", "hash-to-record", `${bankId}_${clientId}_risk.json`);
if (!fs.existsSync(filePath)) {
  console.error(`Risk file not found: ${filePath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath));
if (!Array.isArray(data) || data.length === 0) {
  console.warn(`No risk data in ${filePath}`);
  process.exit(0);
}

const { hash } = data[0];

// Submit to contract
async function run() {
  try {
    const tx = await contract.recordRisk(hash);
    await tx.wait();
    console.log(`Recorded risk hash for ${bankId}/${clientId}: ${hash}`);
  } catch (err) {
    console.error(`Failed to record risk for ${bankId}/${clientId}:`, err.reason || err.message);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

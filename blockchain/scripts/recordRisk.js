const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Get bank name (e.g. bank1) ===
const bankName = process.argv[2];
if (!bankName) {
  console.error("Usage: node blockchain/scripts/recordRisk.js <bankid>");
  process.exit(1);
}

// === Load processed risk score data ===
const dataFile = path.join("bank_data", "processed", `${bankName}_risk.json`);
if (!fs.existsSync(dataFile)) {
  console.error(`File not found: ${dataFile}`);
  process.exit(1);
}

const riskEntries = JSON.parse(fs.readFileSync(dataFile));

// === Set up blockchain connection ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(0);

// === Load RiskLedger ABI and address ===
const { abi, address } = require("../artifacts/contracts/RiskLedger.json");
const contract = new ethers.Contract(address, abi, signer);

// === Record all risk score hashes on-chain ===
async function recordAll() {
  for (const { hash } of riskEntries) {
    console.log(`Recording risk hash: ${hash}`);
    const tx = await contract.recordRiskScore(hash);
    await tx.wait();
    console.log(`Risk score recorded.`);
  }

  console.log("All risk scores recorded.");
}

recordAll().catch((err) => {
  console.error("Error recording risk scores:", err);
  process.exit(1);
});

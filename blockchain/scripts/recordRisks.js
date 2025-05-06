const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Get arguments ===
const [bankId, ...clientIds] = process.argv.slice(2);

if (!bankId || clientIds.length === 0) {
  console.error("Usage: node blockchain/scripts/recordRisks.js <bankid> <clientId1> [clientId2 ...]");
  process.exit(1);
}

// === Set up blockchain connection ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(0);

// === Load RiskLedger contract ===
const { abi, address } = require("../artifacts/contracts/RiskLedger.json");
const contract = new ethers.Contract(address, abi, signer);

// === Record risk for each client ===
async function recordAllRisks() {
  for (const clientId of clientIds) {
    const filePath = path.join("bank_data", "clients", `${bankId}_${clientId}_risk.json`);

    if (!fs.existsSync(filePath)) {
      console.warn(`Risk file not found for client ${clientId}: ${filePath}`);
      continue;
    }

    const riskRecords = JSON.parse(fs.readFileSync(filePath));

    if (riskRecords.length === 0) {
      console.warn(`No risk records found for client ${clientId}`);
      continue;
    }

    const { hash } = riskRecords[0]; // Only one record per file
    console.log(`Recording risk hash for client ${clientId}: ${hash}`);

    try {
      const sender = await signer.getAddress();
      console.log("Recording as:", sender);


      const tx = await contract.recordRisk(hash);
      await tx.wait();
      console.log(`Risk hash recorded for ${clientId}`);
    } catch (err) {
      console.error(`Failed to record risk for ${clientId}:`, err);
    }
  }

  console.log("All risk entries processed.");
}

recordAllRisks().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

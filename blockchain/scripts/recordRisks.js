const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Get clientId from CLI ===
const clientId = process.argv[2];
if (!clientId) {
  console.error("Usage: node blockchain/scripts/recordRisks.js <clientId>");
  process.exit(1);
}

// === Load mappings ===
const addressMap = JSON.parse(fs.readFileSync("bank_data/wallets/bank_address_map.json", "utf8"));
const privateKeys = JSON.parse(fs.readFileSync("bank_data/wallets/bank_private_keys.json", "utf8"));

// === Setup provider ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const { abi, address } = require("../artifacts/contracts/RiskLedger.json");
const RiskLedger = new ethers.Contract(address, abi);

async function recordRisk(bankId, address, privateKey) {
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = RiskLedger.connect(signer);

  const filePath = path.join("bank_data", "hash-to-record", `${bankId}_${clientId}_risk.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Risk file not found for bank ${bankId}, client ${clientId}: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath));
  if (!Array.isArray(data) || data.length === 0) {
    console.warn(`No risk data in ${filePath}`);
    return;
  }

  const { hash } = data[0]; // One hash per client
  //console.log(`Recording risk hash for ${bankId}/${clientId}: ${hash}`);
  try {
    const tx = await contract.recordRisk(hash);
    await tx.wait();
    //console.log(`Risk hash recorded for ${clientId} by bank ${bankId}`);
  } catch (err) {
    console.error(`Failed to record risk for ${clientId} by bank ${bankId}:`, err.reason || err.message);
  }
}

async function main() {
  const accounts = await provider.listAccounts();
  const initBankAddress = accounts[1].toLowerCase();

  for (const [bankId, bankAddress] of Object.entries(addressMap)) {
    if (bankAddress.toLowerCase() === initBankAddress) continue;

    const privateKey = Object.entries(privateKeys).find(
      ([addr]) => addr.toLowerCase() === bankAddress.toLowerCase()
    )?.[1];

    if (!privateKey) {
      console.warn(`No private key found for ${bankId} (${bankAddress}). Skipping.`);
      continue;
    }

    await recordRisk(bankId, bankAddress, privateKey);
  }

  //console.log("All risk hashes processed for invited banks.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

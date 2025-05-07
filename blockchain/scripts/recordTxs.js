const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Get args ===
const bankId = process.argv[2];
const clientId = process.argv[3];
const privateKey = process.argv[4];

if (!bankId || !clientId || !privateKey) {
  console.error("Usage: node blockchain/scripts/recordTxs.js <bankId> <clientId> <privateKey>");
  process.exit(1);
}

// === Load bank address from map ===
const addressMapPath = path.join("bank_data", "wallets", "bank_address_map.json");
const addressMap = JSON.parse(fs.readFileSync(addressMapPath, "utf8"));

const bankAddress = addressMap[bankId];
if (!bankAddress) {
  console.error(`Bank address not found for bank ID: ${bankId}`);
  process.exit(1);
}

// === Load transaction data file ===
const dataFile = path.join("bank_data", "hash-to-record", `${bankId}_${clientId}_incomes.json`);
if (!fs.existsSync(dataFile)) {
  console.error(`Transaction hash file not found: ${dataFile}`);
  process.exit(1);
}
const transactions = JSON.parse(fs.readFileSync(dataFile));

// === Setup provider and signer ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = new ethers.Wallet(privateKey, provider);

// === Load contract ===
const { abi, address } = require("../artifacts/contracts/TxLedger.json");
const contract = new ethers.Contract(address, abi, signer);

// === Submit all hashes ===
async function run() {
  for (const { hash } of transactions) {
    try {
      const tx = await contract.recordTransaction(hash);
      await tx.wait();
      // console.log(`Recorded: ${hash}`);
    } catch (err) {
      console.error(`Failed to record hash ${hash}:`, err.reason || err.message);
    }
  }
}

run().catch((err) => {
  console.error("Error in recordTxs:", err);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Get clientId from CLI ===
const clientId = process.argv[2];
if (!clientId) {
  console.error("Usage: node blockchain/scripts/recordTxs.js <clientId>");
  process.exit(1);
}

// === Setup provider and get init bank address (Anvil address[1]) ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
async function run() {
  const accounts = await provider.listAccounts();
  const initBankAddress = accounts[1].toLowerCase(); // Anvil address(1)

  // === Load address map to find bankId for init bank ===
  const addressMapPath = path.join("bank_data", "wallets", "bank_address_map.json");
  const addressMap = JSON.parse(fs.readFileSync(addressMapPath, "utf8"));

  const initBankId = Object.entries(addressMap).find(
    ([_, addr]) => addr.toLowerCase() === initBankAddress
  )?.[0];

  if (!initBankId) {
    console.error("Init bank address not found in bank_address_map.json");
    process.exit(1);
  }

  // === Load private key for init bank ===
  const keyMapPath = path.join("bank_data", "wallets", "bank_private_keys.json");
  const privateKeys = JSON.parse(fs.readFileSync(keyMapPath, "utf8"));

  const initBankPrivateKey = Object.entries(privateKeys).find(
    ([addr]) => addr.toLowerCase() === initBankAddress
  )?.[1];

  if (!initBankPrivateKey) {
    console.error("Private key not found for init bank address:", initBankAddress);
    process.exit(1);
  }

  const signer = new ethers.Wallet(initBankPrivateKey, provider);

  // === Load transaction data file ===
  const dataFile = path.join("bank_data", "hash-to-record", `${initBankId}_${clientId}_incomes.json`);
  if (!fs.existsSync(dataFile)) {
    console.error(`File not found: ${dataFile}`);
    process.exit(1);
  }

  const transactions = JSON.parse(fs.readFileSync(dataFile));

  // === Load TxLedger contract ===
  const { abi, address } = require("../artifacts/contracts/TxLedger.json");
  const contract = new ethers.Contract(address, abi, signer);

  // === Record all hashes ===
  for (const { hash } of transactions) {
    // console.log(`Recording hash: ${hash}`);
    try {
      const tx = await contract.recordTransaction(hash);
      await tx.wait();
      // console.log(`Transaction confirmed.`);
    } catch (err) {
      // console.error(`Failed to record hash ${hash}:`, err);
    }
  }

  //console.log("All transactions recorded.");
}

run().catch((err) => {
  console.error("Error recording transactions:", err);
  process.exit(1);
});

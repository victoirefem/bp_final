const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === Input args ===
const bankId = process.argv[2];
const mode = process.argv[3]; // "i" or "r"
const bankAddress = process.argv[4];
const bankPrivateKey = process.argv[5];

if (!bankId || !["i", "r"].includes(mode) || !bankAddress || !bankPrivateKey) {
  console.error("Usage: node backend/zk/get-commitments.js <bankId> <i|r> <bankAddress> <bankPrivateKey>");
  process.exit(1);
}

const isIncome = mode === "i";
const inputPath = path.join("backend", "pdata", isIncome ? "incomes" : "risks", `${bankId}.json`);
const outputPath = path.join("backend", "zk", "zk-inputs", `${bankId}_${isIncome ? "incomes" : "risks"}.json`);

const artifact = require(`../../blockchain/artifacts/contracts/${isIncome ? "TxLedger" : "RiskLedger"}.json`);
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = new ethers.Wallet(bankPrivateKey, provider);
const contract = new ethers.Contract(artifact.address, artifact.abi, signer);

// === Convert string to field-safe BigInt
function strToField(s) {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
  return BigInt(hash);
}

async function fetchCommitments() {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const pdata = JSON.parse(fs.readFileSync(inputPath));
  const commitments = [];
  const senderAddress = await signer.getAddress();
  console.log(`Verifying on-chain data as: ${senderAddress}`);

  for (const entry of pdata) {
    let fields;

    if (isIncome) {
      fields = [
        strToField(entry["Timestamp"]),
        strToField(entry["From Bank"]),
        strToField(entry["From Account"]),
        strToField(entry["To Account"]),
        strToField(entry["Amount Received"]),
        strToField(entry["Receiving Currency"]),
        strToField(entry["Converted USD"])
      ];
    } else {
      fields = [
        strToField(entry["Account"]),
        strToField(entry["Risk Score"])
      ];
    }

    const hashBigInt = poseidon(fields);
    const hashHex = "0x" + F.toString(hashBigInt, 16).padStart(64, "0");

    try {
      const result = isIncome
        ? await contract.getTransactionByHash(senderAddress, hashHex)
        : await contract.getRiskByHash(senderAddress, hashHex);

      commitments.push(result[0]);
      console.log(`Verified on-chain: ${hashHex}`);
    } catch (err) {
      console.error(`Hash not found on-chain: ${hashHex}`);
      process.exit(1);
    }
  }

  const key = isIncome ? "txCommitments" : "riskCommitments";

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({ [key]: commitments }, null, 2));
  console.log(`Public inputs written to ${outputPath}`);
}

fetchCommitments().catch(err => {
  console.error("Error fetching commitments:", err);
});

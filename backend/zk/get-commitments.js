const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === Input args ===
const bankId = process.argv[2];
if (!bankId) {
  console.error("Usage: node backend/zk/get-commitments.js <bankId>");
  process.exit(1);
}

// === Paths ===
const inputPath = path.join("backend", "pdata", "incomes", `${bankId}.json`);
const outputPath = path.join("backend", "zk", "zk-inputs", `${bankId}_incomes.json`);

const artifact = require("../../blockchain/artifacts/contracts/TxLedger.json");
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(0);
const contract = new ethers.Contract(artifact.address, artifact.abi, signer);

// === Convert a string to field-safe BigInt
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
  const bankAddress = await signer.getAddress();

  for (const tx of pdata) {
    const fields = [
      strToField(tx["Timestamp"]),
      strToField(tx["From Bank"]),
      strToField(tx["From Account"]),
      strToField(tx["To Account"]),
      strToField(tx["Amount Received"]),
      strToField(tx["Receiving Currency"]),
      strToField(tx["Converted USD"])
    ];

    const hashBigInt = poseidon(fields);
    const hashHex = "0x" + F.toString(hashBigInt, 16).padStart(64, "0");

    try {
      const txOnChain = await contract.getTransactionByHash(bankAddress, hashHex);
      commitments.push(txOnChain[0]); // .hash
      console.log(`Verified on-chain: ${hashHex}`);
    } catch (err) {
      console.error(`Hash not found on-chain: ${hashHex}`);
      process.exit(1);
    }
  }

  // Save
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({ txCommitments: commitments }, null, 2));
  console.log(`Public inputs written to ${outputPath}`);
}

fetchCommitments().catch(err => {
  console.error("Error fetching commitments:", err);
});

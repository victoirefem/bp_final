const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === Hardcoded parameters ===
const bankId = "20";
const mode = "i";
const bankAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const bankPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const inputPath = path.join("backend", "pdata", "proofs", `${bankId}.json`);
const outputPath = path.join("backend", "zk", "zk-inputs", `${bankId}_proofs.json`);

const artifact = require("../../blockchain/artifacts/contracts/TxLedger.json");
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(0); // Anvil address(0) signer

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

  for (const entry of pdata) {
    const fields = [
      strToField(entry["Timestamp"]),
      strToField(entry["From Bank"]),
      strToField(entry["From Account"]),
      strToField(entry["To Account"]),
      strToField(entry["Amount Received"]),
      strToField(entry["Receiving Currency"]),
      strToField(entry["Converted USD"])
    ];

    const hashBigInt = poseidon(fields);
    const hashHex = "0x" + F.toString(hashBigInt, 16).padStart(64, "0");

    try {
      const contract = new ethers.Contract(artifact.address, artifact.abi, signer);
      const result = await contract.getTransactionByHash(hashHex);
      commitments.push(result[0]); // commitment
    } catch (err) {
      console.error(`Hash not found on-chain: ${hashHex}`);
      process.exit(1);
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({ txCommitments: commitments }, null, 2));
  console.log(`Commitments saved to ${outputPath}`);
}

fetchCommitments().catch(err => {
  console.error("Error fetching commitments:", err);
});

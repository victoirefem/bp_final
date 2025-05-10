const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Args: sessionId, bankAddress, bankPrivateKey, proofType (e.g., incomes or risks)
const [sessionId, bankAddress, bankPrivateKey, proofType] = process.argv.slice(2);

if (!sessionId || !bankAddress || !bankPrivateKey || !proofType) {
  console.error("Usage: node publishProof.js <sessionId> <bankAddress> <privateKey> <proofType>");
  process.exit(1);
}

// Derive bankId from wallet address map
function getBankIdFromAddress(address) {
  const bankMapPath = path.join("bank_data", "wallets", "bank_address_map.json");
  const bankMap = JSON.parse(fs.readFileSync(bankMapPath));
  for (const [bankId, addr] of Object.entries(bankMap)) {
    if (addr.toLowerCase() === address.toLowerCase()) return bankId;
  }
  throw new Error(`Bank ID not found for address ${address}`);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = new ethers.Wallet(bankPrivateKey, provider);

  const sessionPath = path.join("blockchain", "artifacts", "contracts", "SessionManager.json");
  const sessionArtifact = JSON.parse(fs.readFileSync(sessionPath));

  const contract = new ethers.Contract(sessionArtifact.address, sessionArtifact.abi, signer);

  const bankId = getBankIdFromAddress(bankAddress);
  const proofPath = path.join("bank_data", "proofs", `${bankId}_${proofType}.json`);
  if (!fs.existsSync(proofPath)) {
    console.error(`Proof file not found: ${proofPath}`);
    process.exit(1);
  }

  const { a, b, c, publicSignals } = JSON.parse(fs.readFileSync(proofPath, "utf8"));

  try {
    const tx = await contract.publishProof(sessionId, a, b, c, publicSignals);
    await tx.wait();
    console.log(`✔ Proof published for ${bankId} in session ${sessionId}`);
  } catch (err) {
    console.error("❌ Failed to publish proof:", err.reason || err.message);
    process.exit(1);
  }
}

main();

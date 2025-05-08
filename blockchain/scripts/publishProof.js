const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Args: sessionId, bankAddress, bankPrivateKey, proofString
const [sessionId, bankAddress, bankPrivateKey, proofString] = process.argv.slice(2);

if (!sessionId || !bankAddress || !bankPrivateKey || !proofString) {
  console.error("Usage: node publishProof.js <sessionId> <bankAddress> <privateKey> <proofString>");
  process.exit(1);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = new ethers.Wallet(bankPrivateKey, provider);

  const sessionPath = path.join("blockchain", "artifacts", "contracts", "SessionManager.json");
  const sessionArtifact = JSON.parse(fs.readFileSync(sessionPath));

  const contract = new ethers.Contract(sessionArtifact.address, sessionArtifact.abi, signer);

  try {
    const tx = await contract.publishProof(sessionId, proofString);
    await tx.wait();
    console.log(`Proof published for ${bankAddress} in session ${sessionId}`);
  } catch (err) {
    console.error("Failed to publish proof:", err.reason || err.message);
    process.exit(1);
  }
}

main();

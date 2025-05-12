const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Args
const [sessionId, bankAddress, privateKey] = process.argv.slice(2);

if (!sessionId || !bankAddress || !privateKey) {
  console.error("Usage: node finish.js <sessionId> <bankAddress> <privateKey>");
  process.exit(1);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = new ethers.Wallet(privateKey, provider);

  const sessionPath = path.join("blockchain", "artifacts", "contracts", "SessionManager.json");
  const sessionArtifact = JSON.parse(fs.readFileSync(sessionPath));
  const contract = new ethers.Contract(sessionArtifact.address, sessionArtifact.abi, signer);

  try {
    const tx = await contract.finishSession(sessionId);
    await tx.wait();
    console.log(`--> Session ${sessionId} finished`);
  } catch (err) {
    console.error("Failed to finish session:", err.reason || err.message);
    process.exit(1);
  }
}

main();

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error("Usage: node start.js <sessionId> <initBankAddress> <initBankPrivateKey>");
    process.exit(1);
  }

  const [sessionId, initBankAddress, initBankPrivateKey] = args;

  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = new ethers.Wallet(initBankPrivateKey, provider);

  // Load contract
  const artifactPath = path.join("blockchain", "artifacts", "contracts", "SessionManager.json");
  const sessionArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const contract = new ethers.Contract(sessionArtifact.address, sessionArtifact.abi, signer);

  try {
    const tx = await contract.startSession(sessionId);
    await tx.wait();
    //console.log(`Session ${sessionId} successfully started by ${initBankAddress}`);
  } catch (err) {
    //console.error("Failed to start session:", err.reason || err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

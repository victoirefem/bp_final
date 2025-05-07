const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3 || args.length % 2 === 0) {
    console.error("Usage: node join.js <sessionId> <bankAddress1> <privateKey1> [<bankAddress2> <privateKey2> ...]");
    process.exit(1);
  }

  const sessionId = args[0];
  const banks = [];

  for (let i = 1; i < args.length; i += 2) {
    banks.push({
      address: args[i],
      privateKey: args[i + 1]
    });
  }

  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

  // Load SessionManager contract
  const artifactPath = path.join("blockchain", "artifacts", "contracts", "SessionManager.json");
  const sessionArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const contractAddress = sessionArtifact.address;
  const contractAbi = sessionArtifact.abi;

  for (const bank of banks) {
    const signer = new ethers.Wallet(bank.privateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      const tx = await contract.joinSession(sessionId);
      await tx.wait();
      console.log(`Bank ${bank.address} joined session ${sessionId}`);
    } catch (err) {
      console.error(`Failed to join for bank ${bank.address}:`, err.reason || err.message);
    }
  }
}

main().catch(err => {
  console.error("Error in join process:", err);
  process.exit(1);
});

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// === Parse arguments ===
const [initBankAddress, initBankPrivateKey] = process.argv.slice(2);
if (!initBankAddress || !initBankPrivateKey) {
  console.error("Usage: node start.js <initBankAddress> <initBankPrivateKey>");
  process.exit(1);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = new ethers.Wallet(initBankPrivateKey, provider);
  const normalizedInitAddress = initBankAddress.toLowerCase();

  // Load address map
  const addressMapPath = path.join("bank_data", "wallets", "bank_address_map.json");
  const addressMap = JSON.parse(fs.readFileSync(addressMapPath, "utf8"));

  // Validate init address exists in map
  const initBankId = Object.keys(addressMap).find(
    id => addressMap[id].toLowerCase() === normalizedInitAddress
  );

  if (!initBankId) {
    console.error("Init bank address not found in bank_address_map.json");
    process.exit(1);
  }

  // Get invited banks
  const invitedBankAddresses = Object.entries(addressMap)
    .filter(([_, addr]) => addr.toLowerCase() !== normalizedInitAddress)
    .map(([_, addr]) => addr);

  // console.log("Invited banks:", invitedBankAddresses);

  // Load contract
  const artifactPath = path.join("blockchain", "artifacts", "contracts", "SessionManager.json");
  const sessionArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const contract = new ethers.Contract(sessionArtifact.address, sessionArtifact.abi, signer);

  // Start session
  const joinDeadline = Math.floor(Date.now() / 1000) + 3600;
  const tx = await contract.createSession(invitedBankAddresses, joinDeadline);
  const receipt = await tx.wait();

  console.log(`Session created by init bank ${initBankId} (${initBankAddress})`);
  const event = receipt.events.find(e => e.event === "SessionCreated");
  if (event) {
    console.log("Session ID:", event.args.sessionId.toString());
  } else {
    console.warn("SessionCreated event not found.");
  }
}

main().catch(err => {
  console.error("Error creating session:", err);
  process.exit(1);
});

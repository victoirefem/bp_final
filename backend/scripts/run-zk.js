const { execSync } = require("child_process");

// === Validate args ===
const bankId = process.argv[2];
const mode = process.argv[3]; // "i" or "r"
const bankAddress = process.argv[4];
const bankPrivateKey = process.argv[5];

if (!bankId || !["i", "r"].includes(mode) || !bankAddress || !bankPrivateKey) {
  console.error("Usage: node backend/scripts/run-zk.js <bankId> <i|r> <bankAddress> <bankPrivateKey>");
  process.exit(1);
}

// === Helper to run shell commands and forward output
function run(cmd) {
  console.log(`\nRunning: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error("Command failed");
    process.exit(1);
  }
}

// === ZK pipeline ===
run(`node backend/zk/get-commitments.js ${bankId} ${mode} ${bankAddress} ${bankPrivateKey}`);
run(`node backend/zk/get-private-data.js ${bankId} ${mode}`);
run(`python3 backend/zk/generate-circuit.py ${bankId} ${mode}`);
run(`python3 backend/zk/generate-proof-party.py ${bankId} ${mode}`);

console.log("\nAll ZK proof steps completed");

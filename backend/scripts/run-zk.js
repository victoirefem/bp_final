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
console.log(`===> ZK pipeline for bank: ${bankId} (${bankAddress})`);
run(`node backend/zk/get-commitments.js ${bankId} ${mode} ${bankAddress} ${bankPrivateKey}`);
console.log("-> Commitments fetched")
run(`node backend/zk/get-private-data.js ${bankId} ${mode}`);
run(`python3 backend/zk/generate-circuit.py ${bankId} ${mode}`);
const start = Date.now();
run(`python3 backend/zk/generate-proof-party.py ${bankId} ${mode}`);
const end = Date.now();
console.log(`-> ZK proof generated (${bankId})`)

const durationSec = ((end - start) / 1000).toFixed(2);
console.log(`-> ZK proof generated in ${durationSec} seconds`);


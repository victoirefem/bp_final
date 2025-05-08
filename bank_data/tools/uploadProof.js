const fs = require("fs");
const path = require("path");
const { create } = require("ipfs-http-client");

const bankId = process.argv[2];
const proofType = process.argv[3]; // "incomes" or "risks"

if (!bankId || !proofType) {
  console.error("Usage: node uploadProof.js <bankId> <proofType: incomes|risks>");
  process.exit(1);
}

const client = create("http://127.0.0.1:5001");

const dir = path.join("backend", "zk", "zk-circuits", "build", bankId, proofType);
const proofPath = path.join(dir, "proof.json");
const publicPath = path.join(dir, "public.json");

if (!fs.existsSync(proofPath) || !fs.existsSync(publicPath)) {
  console.error(`Missing proof or public.json in ${dir}`);
  process.exit(1);
}

const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf8"));

const bundle = {
  proof,
  publicSignals
};

async function main() {
  const { cid } = await client.add({ content: JSON.stringify(bundle) });
  console.log(`Uploaded to IPFS: ipfs://${cid}`);
}

main().catch((err) => {
  console.error("IPFS upload failed:", err);
  process.exit(1);
});

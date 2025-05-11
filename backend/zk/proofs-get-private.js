const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Hardcoded parameters ===
const bankId = "20";
const isIncome = true;

const inputPath = path.join("backend", "pdata", "proofs", `${bankId}.json`);
const zkInputPath = path.join("backend", "zk", "zk-inputs", `${bankId}_proofs.json`);

if (!fs.existsSync(inputPath)) {
  console.error(`Data not found: ${inputPath}`);
  process.exit(1);
}
if (!fs.existsSync(zkInputPath)) {
  console.error(`zk-inputs file not found: ${zkInputPath}. Run get-commitments.js first.`);
  process.exit(1);
}

// === String to field: keccak256(utf8(string)) => BigInt
function strToField(s) {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
  return BigInt(hash);
}

// === Load and convert ===
const data = JSON.parse(fs.readFileSync(inputPath));
const zkInputs = JSON.parse(fs.readFileSync(zkInputPath));

const pdata = data.map((entry) => [
  strToField(entry["Timestamp"]),
  strToField(entry["From Bank"]),
  strToField(entry["From Account"]),
  strToField(entry["To Account"]),
  strToField(entry["Amount Received"]),
  strToField(entry["Receiving Currency"]),
  strToField(entry["Converted USD"])
]);

zkInputs.pdata = pdata;

// === Save updated zk-inputs ===
fs.writeFileSync(
  zkInputPath,
  JSON.stringify(zkInputs, (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  2)
);

console.log(`Appended ${pdata.length} income records to ${zkInputPath}`);

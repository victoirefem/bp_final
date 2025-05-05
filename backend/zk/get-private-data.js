const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === Get args ===
const bankId = process.argv[2];

if (!bankId) {
  console.error("Usage: node backend/zk/get-private-data.js <bankId>");
  process.exit(1);
}

// === Paths ===
const incomePath = path.join("backend", "pdata", "incomes", `${bankId}.json`);
const zkInputPath = path.join("backend", "zk", "zk-inputs", `${bankId}_incomes.json`);

if (!fs.existsSync(incomePath)) {
  console.error(`Income data not found: ${incomePath}`);
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

// === Load input and convert ===
const incomeData = JSON.parse(fs.readFileSync(incomePath));
const zkInputs = JSON.parse(fs.readFileSync(zkInputPath));

const pdata = incomeData.map((tx) => [
  strToField(tx["Timestamp"]),
  strToField(tx["From Bank"]),
  strToField(tx["From Account"]),
  strToField(tx["To Account"]),
  strToField(tx["Amount Received"]),
  strToField(tx["Receiving Currency"]),
  strToField(tx["Converted USD"])
]);

zkInputs.pdata = pdata;

// === Save updated zk-inputs ===
fs.writeFileSync(
    zkInputPath,
    JSON.stringify(zkInputs, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    2)
  );
console.log(`Appended ${pdata.length} records as pdata to ${zkInputPath}`);

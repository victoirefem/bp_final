const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// Args
const bankId = process.argv[2];
const mode = process.argv[3]; 

if (!bankId || !["i", "r"].includes(mode)) {
  console.error("Usage: node backend/zk/get-private-data.js <bankId> <i|r>");
  process.exit(1);
}

const isIncome = mode === "i";

const inputPath = path.join("backend", "pdata", isIncome ? "incomes" : "risks", `${bankId}.json`);
const zkInputPath = path.join("backend", "zk", "zk-inputs", `${bankId}_${isIncome ? "incomes" : "risks"}.json`);

if (!fs.existsSync(inputPath)) {
  console.error(`Data not found: ${inputPath}`);
  process.exit(1);
}
if (!fs.existsSync(zkInputPath)) {
  console.error(`zk-inputs file not found: ${zkInputPath}. Run get-commitments.js first.`);
  process.exit(1);
}

function strToField(s) {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
  return BigInt(hash);
}

// Load and convert 
const data = JSON.parse(fs.readFileSync(inputPath));
const zkInputs = JSON.parse(fs.readFileSync(zkInputPath));

const pdata = data.map((entry) =>
  isIncome
    ? [
        strToField(entry["Timestamp"]),
        strToField(entry["From Bank"]),
        strToField(entry["From Account"]),
        strToField(entry["To Account"]),
        strToField(entry["Amount Received"]),
        strToField(entry["Receiving Currency"]),
        strToField(entry["Converted USD"])
      ]
    : [
        strToField(entry["Account"]),
        strToField(entry["Risk Score"])
      ]
);

zkInputs.pdata = pdata;

// Save 
fs.writeFileSync(
  zkInputPath,
  JSON.stringify(zkInputs, (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  2)
);

// console.log(`Appended ${pdata.length} ${isIncome ? "income" : "risk"} records to ${zkInputPath}`);

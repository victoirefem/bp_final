const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === Get bank name from CLI ===
const bankName = process.argv[2];
if (!bankName) {
  console.error("Usage: node bank_data/tools/hashIncomeTxs.js <bank_name>");
  process.exit(1);
}

// === Define paths ===
const inputFile = path.join("bank_data", "raw", `${bankName}_income.csv`);
const outputDir = path.join("bank_data", "hashed");
const outputFile = path.join(outputDir, `${bankName}_income.json`);

// === Ensure output folder exists ===
fs.mkdirSync(outputDir, { recursive: true });

// === Convert string to field-safe BigInt ===
function strToField(s) {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
  return BigInt(hash);
}

// === Async wrapper for Poseidon init + processing ===
async function main() {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  const transactions = [];

  fs.createReadStream(inputFile)
    .pipe(csv())
    .on("data", (row) => {
      const {
        Timestamp,
        "From Bank": fromBank,
        "From Account": fromAccount,
        "To Account": toAccount,
        "Amount Received": amount,
        "Receiving Currency": currency,
        "Converted USD": usd
      } = row;

      const fields = [
        strToField(Timestamp),
        strToField(fromBank),
        strToField(fromAccount),
        strToField(toAccount),
        strToField(amount),
        strToField(currency),
        strToField(usd)
      ];

      const hashBigInt = poseidon(fields);
      const hashHex = "0x" + F.toString(hashBigInt, 16).padStart(64, "0"); // hex format

      transactions.push({
        hash: hashHex,
        original: {
          Timestamp,
          fromBank,
          fromAccount,
          toAccount,
          amount,
          currency,
          usd
        }
      });
    })
    .on("end", () => {
      fs.writeFileSync(outputFile, JSON.stringify(transactions, null, 2));
      console.log(`Processed ${transactions.length} transactions and saved to ${outputFile}`);
    })
    .on("error", (err) => {
      console.error("Error processing CSV:", err);
      process.exit(1);
    });
}

main();

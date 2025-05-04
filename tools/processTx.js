const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { ethers } = require("ethers");

// === Get bank name from CLI ===
const bankName = process.argv[2];

if (!bankName) {
  console.error("Usage: node data_tools/processTxs.js <bank_name>");
  process.exit(1);
}

// === Define paths ===
const inputFile = path.join("bank_data", "raw", `${bankName}_income.csv`);
const outputDir = path.join("bank_data", "processed");
const outputFile = path.join(outputDir, `${bankName}_income.json`);

// === Ensure output folder exists ===
fs.mkdirSync(outputDir, { recursive: true });

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

    const encoded = ethers.utils.defaultAbiCoder.encode(
        ["string", "uint256", "string", "string", "string", "string", "string"],
        [
          Timestamp,
          parseInt(fromBank),
          fromAccount,
          toAccount,
          amount,     
          currency,   
          usd         
        ]
      );

    const hash = ethers.utils.keccak256(encoded);

    transactions.push({
      hash,
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

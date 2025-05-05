const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { ethers } = require("ethers");

// === Get bank name from CLI ===
const bankId = process.argv[2];

if (!bankId) {
  console.error("Usage: node data_tools/hashRisks.js <bank_name>");
  process.exit(1);
}

// === Define file paths ===
const inputFile = path.join("bank_data", "raw", `${bankId}_risks.csv`);
const outputDir = path.join("bank_data", "hashed");
const outputFile = path.join(outputDir, `${bankId}_risks.json`);

// === Ensure output folder exists ===
fs.mkdirSync(outputDir, { recursive: true });

const riskScores = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on("data", (row) => {
    const account = row["Account"];
    const risk = row["Risk Score"];

    if (!account || !risk) {
      console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
      return;
    }

    const encoded = ethers.utils.defaultAbiCoder.encode(
      ["string", "string"],
      [account, risk]
    );

    const hash = ethers.utils.keccak256(encoded);

    riskScores.push({
      hash,
      original: {
        account,
        risk
      }
    });
  })
  .on("end", () => {
    fs.writeFileSync(outputFile, JSON.stringify(riskScores, null, 2));
    console.log(`Processed ${riskScores.length} risk scores and saved to ${outputFile}`);
  })
  .on("error", (err) => {
    console.error("Error processing CSV:", err);
    process.exit(1);
  });

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === Get bankId from CLI ===
const bankId = process.argv[2];
if (!bankId) {
  console.error("Usage: node bank_data/tools/hash.js <bankId>");
  process.exit(1);
}

// === Utility: string to field-safe bigint
function strToField(s) {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
  return BigInt(hash);
}

// === Income hashing ===
async function hashIncome(poseidon, F) {
  return new Promise((resolve, reject) => {
    const inputFile = path.join("bank_data", "raw", `${bankId}_income.csv`);
    const outputFile = path.join("bank_data", "hashed", `${bankId}_income.json`);
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
        const hashHex = "0x" + F.toString(hashBigInt, 16).padStart(64, "0");

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
        console.log(`Hashed ${transactions.length} income transactions to ${outputFile}`);
        resolve();
      })
      .on("error", reject);
  });
}

// === Risk hashing ===
async function hashRisks(poseidon, F) {
  return new Promise((resolve, reject) => {
    const inputFile = path.join("bank_data", "raw", `${bankId}_risks.csv`);
    const outputFile = path.join("bank_data", "hashed", `${bankId}_risks.json`);
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

        const fields = [strToField(account), strToField(risk)];
        const hashBigInt = poseidon(fields);
        const hashHex = "0x" + F.toString(hashBigInt, 16).padStart(64, "0");

        riskScores.push({
          hash: hashHex,
          original: {
            "Account": account,
            "Risk Score": risk
          }
        });
      })
      .on("end", () => {
        fs.writeFileSync(outputFile, JSON.stringify(riskScores, null, 2));
        console.log(`Hashed ${riskScores.length} risk records to ${outputFile}`);
        resolve();
      })
      .on("error", reject);
  });
}

// === Main wrapper ===
async function main() {
  const outputDir = path.join("bank_data", "hashed");
  fs.mkdirSync(outputDir, { recursive: true });

  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  try {
    await hashIncome(poseidon, F);
    await hashRisks(poseidon, F);
    console.log("Finished hashing both income and risks.");
  } catch (err) {
    console.error("Error hashing files:", err);
    process.exit(1);
  }
}

main();

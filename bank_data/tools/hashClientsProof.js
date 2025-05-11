const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === Hardcoded bank ID ===
const bankId = "20";

// === Get row limit from CLI arg ===
const maxToHash = parseInt(process.argv[2]);

if (isNaN(maxToHash) || maxToHash <= 0) {
  console.error("Usage: node bank_data/tools/hashClientsProof.js <numRows>");
  process.exit(1);
}

// === File paths ===
const inputFile = path.join("bank_data", "raw", `${bankId}_income.csv`);
const outputDir = path.join("bank_data", "hashed-for-proofs");
const outputFile = path.join(outputDir, `${bankId}_proofs.json`);
fs.mkdirSync(outputDir, { recursive: true });

// === String to Poseidon field ===
const strToField = (s) => {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
  return BigInt(hash);
};

async function hashFirstNFiltered(poseidon, F, limit) {
  return new Promise((resolve, reject) => {
    const filtered = [];
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("data", (row) => {
        if (filtered.length >= limit) return;

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

          filtered.push({
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
        fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2));
        console.log(`Saved ${filtered.length} hashed records to ${outputFile}`);
        resolve();
      })
      .on("error", reject);
  });
}

async function main() {
  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  try {
    await hashFirstNFiltered(poseidon, F, maxToHash);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();

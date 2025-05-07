const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === Get args ===
const bankId = process.argv[2];
const clientIds = process.argv.slice(3);

if (!bankId || clientIds.length === 0) {
  console.error("Usage: node bank_data/tools/hashClients.js <bankId> <client1> <client2> ...");
  process.exit(1);
}

const outputDir = path.join("bank_data", "hash-to-record");
fs.mkdirSync(outputDir, { recursive: true });

const strToField = (s) => {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(s));
  return BigInt(hash);
};

async function hashFilteredIncome(poseidon, F, clientId) {
  const inputFile = path.join("bank_data", "raw", `${bankId}_income.csv`);
  const outputFile = path.join(outputDir, `${bankId}_${clientId}_incomes.json`);

  if (!fs.existsSync(inputFile)) {
    //console.log(`Skipping income: file not found: ${inputFile}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const filtered = [];

    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("data", (row) => {
        if (row["To Account"] === clientId && row["From Bank"] !== bankId) {
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
        }
      })
      .on("end", () => {
        fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2));
        //console.log(`Hashed ${filtered.length} income txs to ${outputFile}`);
        resolve();
      })
      .on("error", reject);
  });
}

async function hashFilteredRisks(poseidon, F, clientId) {
  const inputFile = path.join("bank_data", "raw", `${bankId}_risks.csv`);
  const outputFile = path.join(outputDir, `${bankId}_${clientId}_risk.json`);

  if (!fs.existsSync(inputFile)) {
    // console.log(`Skipping risks: file not found: ${inputFile}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const filtered = [];

    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("data", (row) => {
        if (row["Account"] === clientId) {
          const account = row["Account"];
          const risk = row["Risk Score"];
          const fields = [strToField(account), strToField(risk)];
          const hashBigInt = poseidon(fields);
          const hashHex = "0x" + F.toString(hashBigInt, 16).padStart(64, "0");

          filtered.push({
            hash: hashHex,
            original: {
              Account: account,
              "Risk Score": risk
            }
          });
        }
      })
      .on("end", () => {
        fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2));
        // console.log(`Hashed ${filtered.length} risk entries to ${outputFile}`);
        resolve();
      })
      .on("error", reject);
  });
}

async function main() {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  try {
    for (const clientId of clientIds) {
      //console.log(`\nProcessing client ${clientId} for bank ${bankId}`);
      await hashFilteredIncome(poseidon, F, clientId);
      await hashFilteredRisks(poseidon, F, clientId);
    }
    // console.log("\nFinished hashing all clients.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();

const fs = require("fs");
const path = require("path");

// === Get arguments ===
const bankId = process.argv[2]; // e.g., 10057
const clientAccount = process.argv[3]; // e.g., 804542130

if (!bankId || !clientAccount) {
  console.error("Usage: node tools/filterClient.js <bankId> <clientAccount>");
  process.exit(1);
}

// === Define Paths ===
const incomeInputFile = path.join("bank_data", "hashed", `${bankId}_income.json`);
const riskInputFile = path.join("bank_data", "hashed", `${bankId}_risks.json`);

const clientDir = path.join("bank_data", "clients");
const incomeOutputFile = path.join(clientDir, `${bankId}_${clientAccount}_incomes.json`);
const riskOutputFile = path.join(clientDir, `${bankId}_${clientAccount}_risk.json`);

// === Ensure output folder exists ===
fs.mkdirSync(clientDir, { recursive: true });

// === Filter transactions ===
try {
  const incomeData = JSON.parse(fs.readFileSync(incomeInputFile));

  const filteredTxs = incomeData.filter(tx =>
    tx.original.toAccount === clientAccount && tx.original.fromBank !== bankId
  );

  fs.writeFileSync(incomeOutputFile, JSON.stringify(filteredTxs, null, 2));
  console.log(`Filtered ${filteredTxs.length} transactions saved to ${incomeOutputFile}`);
} catch (err) {
  console.error(`Error filtering transactions:`, err);
}

// === Filter risk entries ===
try {
  const riskData = JSON.parse(fs.readFileSync(riskInputFile));

  const filteredRisks = riskData.filter(entry =>
    entry.original.account === clientAccount
  );

  fs.writeFileSync(riskOutputFile, JSON.stringify(filteredRisks, null, 2));
  console.log(`Filtered ${filteredRisks.length} risk entries saved to ${riskOutputFile}`);
} catch (err) {
  console.error(`Error filtering risks:`, err);
}

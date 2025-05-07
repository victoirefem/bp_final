const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

async function main() {
  const args = process.argv.slice(2);

  const initIndex = args.indexOf("--init");
  const joinIndex = args.indexOf("--j");

  if (initIndex === -1 || joinIndex === -1 || joinIndex <= initIndex) {
    console.error("Usage: node generateBankMap.js --init <initBankId> --j <bankId1> <bankId2> ...");
    process.exit(1);
  }

  const initBankId = args[initIndex + 1];
  const joinBankIds = args.slice(joinIndex + 1);

  // Validate
  if (!initBankId || joinBankIds.length === 0 || initBankId.startsWith("--")) {
    console.error("You must provide one init bank ID and at least one join bank ID.");
    process.exit(1);
  }

  // Connect to Anvil
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const accounts = await provider.listAccounts();

  const totalNeeded = 1 + joinBankIds.length; // init + invited
  if (totalNeeded + 1 > accounts.length) { // +1 because accounts[0] is reserved (e.g. regulator)
    console.error(`Anvil only provides ${accounts.length} accounts; need ${totalNeeded + 1} including the regulator.`);
    process.exit(1);
  }

  const mapping = {};

  // Map init bank → accounts[1]
  mapping[initBankId] = accounts[1];

  // Map invited banks → accounts[2], [3], ...
  for (let i = 0; i < joinBankIds.length; i++) {
    mapping[joinBankIds[i]] = accounts[i + 2];
  }

  // Write to blockchain/wallets/bank_address_map.json
  const outputPath = path.join("bank_data", "wallets", "bank_address_map.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

  // console.log("Bank ID to address map saved to:", outputPath);
}

main().catch((err) => {
  console.error("Error generating bank map:", err);
  process.exit(1);
});

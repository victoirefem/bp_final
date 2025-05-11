const { ethers } = require("ethers");
const fs = require("fs");
const solc = require("solc");
const path = require("path");

const contractsToDeploy = [
  { name: "TxLedger", file: "TxLedger.sol" },
  { name: "RiskLedger", file: "RiskLedger.sol" },
  { name: "SessionManager", file: "Session.sol" }
];

async function compileAndDeploy(contractName, sourceFile) {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = provider.getSigner(0);

  const source = fs.readFileSync(`blockchain/src/${sourceFile}`, "utf8");

  const input = {
    language: "Solidity",
    sources: { [sourceFile]: { content: source } },
    settings: {
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode"] }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (!output.contracts || !output.contracts[sourceFile] || !output.contracts[sourceFile][contractName]) {
    throw new Error(`Compilation failed for ${contractName} in ${sourceFile}`);
  }

  const contractData = output.contracts[sourceFile][contractName];
  const bytecode = contractData.evm.bytecode.object;
  const abi = contractData.abi;

  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.deployed();

  console.log(`${contractName} deployed at: ${contract.address}`);

  const outputPath = path.join("blockchain", "artifacts", "contracts", `${contractName}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    address: contract.address,
    abi,
    bytecode
  }, null, 2));

  // console.log(`ABI + address saved to: ${outputPath}\n`);
}

async function main() {
  for (const { name, file } of contractsToDeploy) {
    await compileAndDeploy(name, file);
  }

  // console.log("Contracts deployed successfully.");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});

const { ethers } = require("ethers");
const fs = require("fs");
const solc = require("solc");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const signer = provider.getSigner(0);

    // Read and compile TxLedger.sol
    const source = fs.readFileSync("blockchain/src/TxLedger.sol", "utf8");
    const input = {
        language: "Solidity",
        sources: { "TxLedger.sol": { content: source } },
        settings: {
            outputSelection: {
                "*": { "*": ["abi", "evm.bytecode"] }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractData = output.contracts["TxLedger.sol"]["TxLedger"];
    const bytecode = contractData.evm.bytecode.object;
    const abi = contractData.abi;

    // Deploy the contract
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy(); // No constructor arguments
    await contract.deployed();

    console.log("- TxLedger contract deployed at:", contract.address);

    // Save ABI and address
    const outputDir = "blockchain/artifacts/contracts";
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(`${outputDir}/TxLedger.json`, JSON.stringify({
        address: contract.address,
        abi: abi,
        bytecode: bytecode
    }, null, 2));

    console.log(`ABI + address saved to: ${outputDir}/TxLedger.json`);
}

main().catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
});

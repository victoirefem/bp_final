const { ethers } = require("ethers");
const fs = require("fs");
const solc = require("solc");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const signer = provider.getSigner(0);
    const regulatorAddress = await signer.getAddress();

    // Read and compile contract
    const source = fs.readFileSync("src/ClientLedger.sol", "utf8");
    const input = {
        language: "Solidity",
        sources: { "ClientLedger.sol": { content: source } },
        settings: {
            outputSelection: {
                "*": { "*": ["abi", "evm.bytecode"] }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractData = output.contracts["ClientLedger.sol"]["ClientLedger"];
    const bytecode = contractData.evm.bytecode.object;
    const abi = contractData.abi;

    // Deploy contract with regulator address
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy(regulatorAddress);
    await contract.deployed();

    console.log("-Contract deployed at:", contract.address);
    console.log("-AML Regulator Address:", regulatorAddress);

    // Save ABI and address
    const outputDir = "artifacts/contracts";
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(`${outputDir}/ClientLedger.json`, JSON.stringify({
        address: contract.address,
        abi: abi,
        bytecode: bytecode
    }, null, 2));

    console.log(`ABI + address: ${outputDir}/ClientLedger.json`);
}

main().catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
});

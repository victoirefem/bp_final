const { ethers } = require("ethers");
const fs = require("fs");
const solc = require("solc");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const signer = provider.getSigner(0);

    // Read and compile contract
    const source = fs.readFileSync("src/MpcSession.sol", "utf8");
    const input = {
        language: "Solidity",
        sources: { "MpcSession.sol": { content: source } },
        settings: {
            outputSelection: {
                "*": { "*": ["abi", "evm.bytecode"] }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractData = output.contracts["MpcSession.sol"]["MpcSession"];
    const bytecode = contractData.evm.bytecode.object;
    const abi = contractData.abi;

    // Deploy contract
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy();  // <--- no constructor args
    await contract.deployed();

    console.log("- MpcSession contract deployed at:", contract.address);

    // Save ABI and address
    const outputDir = "artifacts/contracts";
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(`${outputDir}/MpcSession.json`, JSON.stringify({
        address: contract.address,
        abi: abi,
        bytecode: bytecode
    }, null, 2));

    console.log(`ABI + address saved to: ${outputDir}/MpcSession.json`);
}

main().catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
});

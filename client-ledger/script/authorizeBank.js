// script/authorizeBank.js
const { ethers } = require("ethers");
const fs = require("fs");

// === CONFIG ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const regulator = provider.getSigner(0); // Regulator is signer[0]

async function main() {
    const bankIndex = parseInt(process.argv[2]);

    if (isNaN(bankIndex)) {
        console.error("❌ Please provide a valid bank index. Usage: node script/authorizeBank.js <bank_id>");
        process.exit(1);
    }

    const contractMeta = JSON.parse(fs.readFileSync("artifacts/contracts/ClientLedger.json", "utf8"));
    const contract = new ethers.Contract(contractMeta.address, contractMeta.abi, regulator);

    const bankAddress = await provider.getSigner(bankIndex).getAddress();
    console.log(`🔐 Authorizing bank ${bankIndex}: ${bankAddress}...`);

    const tx = await contract.setBank(bankAddress, true);
    await tx.wait();

    console.log("✅ Bank successfully authorized.");
}

main().catch(console.error);

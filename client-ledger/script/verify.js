const { ethers } = require("ethers");
const fs = require("fs");

// === CONFIG ===
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const signer = provider.getSigner(0);

// Load contract metadata
const contractMeta = JSON.parse(fs.readFileSync("artifacts/contracts/ClientLedger.json", "utf8"));
const abi = contractMeta.abi;
const contract = new ethers.Contract(contractMeta.address, abi, signer);

// === MAIN ===
async function main() {
    const ssn = "1488";
    const month = 202504;

    const staticSalt = "static_salt_123";
    const txSalt = "tx_salt_456";

    // Load and hash static profile
    const staticProfile = JSON.parse(fs.readFileSync(`data/bank1/static/${ssn}_${month}.json`, "utf8"));
    const staticStr = `${staticProfile.kyc}||${staticProfile.expIncome}||${staticProfile.creditScore}||${staticProfile.accTenure}||${staticProfile.creditLimit}||${staticProfile.creditAmount}||${staticProfile.PEP}`;
    const staticHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${ssn}||${staticStr}||${staticSalt}`));

    // Load and hash transaction profile
    const txProfile = JSON.parse(fs.readFileSync(`data/bank1/transactions/${ssn}_${month}.json`, "utf8"));
    const txStr = `${txProfile.totalIncome}||${txProfile.numRefunds}||${txProfile.numTx}||${txProfile.numHRC}||${txProfile.numCountries}`;
    const txHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${ssn}||${txStr}||${txSalt}`));

    console.log("🔍 Verifying on-chain commitments...");

    const bankAddress = await signer.getAddress();

    // Static check
    const [storedStaticHash, staticComment] = await contract.getStaticCommitment(bankAddress, month);
    console.log("\n📘 Static Commitment:");
    console.log("• Stored: ", storedStaticHash);
    console.log("• Local:  ", staticHash);
    console.log("• Match?:", storedStaticHash === staticHash);
    console.log("• Comment:", staticComment);

    // Tx check
    const [storedTxHash, txComment] = await contract.getTxCommitment(bankAddress, month);
    console.log("\n📗 TX Commitment:");
    console.log("• Stored: ", storedTxHash);
    console.log("• Local:  ", txHash);
    console.log("• Match?:", storedTxHash === txHash);
    console.log("• Comment:", txComment);
}

main().catch(console.error);

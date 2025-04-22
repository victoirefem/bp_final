const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === CONFIG (default values) ===
const ssn = "1488";
const month = 202504; // Format YYYYMM

// === HELPERS ===
function loadJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(...relativePath), "utf8"));
}

// === MAIN ===
async function generateHashes(bankId, ssn, month) {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    const staticPath = ["data", `bank${bankId}`, "static", `${ssn}_${month}.json`];
    const txPath = ["data", `bank${bankId}`, "transactions", `${ssn}_${month}.json`];
    const saltPath = ["data", `bank${bankId}`, "salts", `${ssn}.json`];

    const staticData = loadJson(staticPath);
    const txData = loadJson(txPath);
    const { salt } = loadJson(saltPath);

    const saltBig = BigInt(salt);
    const ssnBig = BigInt(ssn);

    const staticInputs = [
        ssnBig,
        BigInt(staticData.kyc),
        BigInt(staticData.expectedIncome),
        BigInt(staticData.creditScore),
        BigInt(staticData.accountTenure),
        BigInt(staticData.creditLimit),
        BigInt(staticData.creditAmount),
        BigInt(staticData.pep),
        saltBig
    ];

    const txInputs = [
        ssnBig,
        BigInt(txData.totalIncome),
        BigInt(txData.numRefunds),
        BigInt(txData.numTx),
        BigInt(txData.numHRC),
        BigInt(txData.numCountries),
        saltBig
    ];

    // ✅ Poseidon hashing
    const staticHashBigInt = F.toObject(poseidon(staticInputs));
    const txHashBigInt = F.toObject(poseidon(txInputs));

    const staticHash = ethers.utils.hexZeroPad("0x" + staticHashBigInt.toString(16), 32);
    const txHash = ethers.utils.hexZeroPad("0x" + txHashBigInt.toString(16), 32);

    console.log("🔐 Generated Poseidon Hashes:");
    console.log("• Static Profile Hash:", staticHash);
    console.log("• TX Profile Hash:    ", txHash);

    const outputDir = path.join("data", `bank${bankId}`, "profiles");
    const outputPath = path.join(outputDir, `${ssn}_${month}.json`);

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({
        staticHash,
        txHash,
        month,
        ssn,
        generatedAt: new Date().toISOString()
    }, null, 2));

    console.log(`📦 Saved to ${outputPath}`);
}

// === RUN ===
const bankIdArg = process.argv[2];
if (!bankIdArg) {
    console.error("❌ Please provide the bank ID");
    process.exit(1);
}
generateHashes(Number(bankIdArg), ssn, month);

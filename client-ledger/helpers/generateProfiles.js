const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === CONFIG ===
const ssnClient = "1488";
const ssnPRF = "prf";
const month = 202504;

// === HELPERS ===
function loadJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(...relativePath), "utf8"));
}

// === CLIENT PROFILE ===
async function generateClientHashes(bankId, ssn, month) {
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

    const staticHash = ethers.utils.hexZeroPad("0x" + F.toObject(poseidon(staticInputs)).toString(16), 32);
    const txHash = ethers.utils.hexZeroPad("0x" + F.toObject(poseidon(txInputs)).toString(16), 32);

    console.log("Generated Poseidon Hashes:");
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

    console.log(`Saved to ${outputPath}`);
}

// === PRF PROFILE ===
async function generatePRFHash(bankId, month) {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    const bankDir = path.join("data", `bank${bankId}`);
    const prfData = loadJson([bankDir, 'prf', `prf_${month}.json`]);
    const { prf } = prfData;

    const { salt } = loadJson([bankDir, "salts", "prf.json"]);
    const prfSaltBig = BigInt(salt);

    const prfInput = [prf, prfSaltBig];
    const prfHash = ethers.utils.hexZeroPad("0x" + F.toObject(poseidon(prfInput)).toString(16), 32);

    const outputDir = path.join(bankDir, "profiles");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `prf_${month}.json`);
    fs.writeFileSync(outputPath, JSON.stringify({
        prfHash,
        month,
        generatedAt: new Date().toISOString()
    }, null, 2));

    console.log("Poseidon PRF Hash:", prfHash);
    console.log(`Saved to ${outputPath}`);
}

// === EXECUTE ===
const bankIdArg = process.argv[2];
const profileType = process.argv[3] || "client"; // default: client

if (!bankIdArg || isNaN(bankIdArg)) {
    console.error("provide a valid bank ID");
    process.exit(1);
}

if (profileType === "client") {
    generateClientHashes(Number(bankIdArg), ssnClient, month);
} else if (profileType === "prf") {
    generatePRFHash(Number(bankIdArg), month);
} else {
    console.error("Invalid profile type. Use 'client' or 'prf'");
    process.exit(1);
}

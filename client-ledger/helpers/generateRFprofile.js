const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const circomlibjs = require("circomlibjs");

// === CONFIG ===
const month = 202504; // Format YYYYMM

// === HELPERS ===
function loadJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(...relativePath), "utf8"));
}

async function generatePrfHash(bankId, month) {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    const bankDir = path.join("data", `bank${bankId}`);
    const prfData = loadJson([bankDir, 'prf', `prf_${month}.json`]);
    const { prf } = prfData;

    const { salt } = loadJson([bankDir, "salts", "prf.json"]);
    const prfSaltBig = BigInt(salt);
    const prfValueBig = BigInt(Math.round(prf * 10000)); // Optional: scale to avoid float

    const prfInput = [prfValueBig, prfSaltBig];
    const prfHash = ethers.utils.hexZeroPad("0x" + F.toObject(poseidon(prfInput)).toString(16), 32);

    // === Save output ===
    const outputDir = path.join(bankDir, "profiles");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `prf_${month}.json`);
    fs.writeFileSync(outputPath, JSON.stringify({
        prfHash,
        month,
        generatedAt: new Date().toISOString()
    }, null, 2));

    console.log("🔐 Poseidon P(RF) Hash:", prfHash);
    console.log(`📦 Saved to ${outputPath}`);
}

// === EXECUTE ===
const bankIdArg = process.argv[2];
if (!bankIdArg) {
    console.error("❌ Please provide the bank ID");
    process.exit(1);
}

generatePrfHash(Number(bankIdArg), month);

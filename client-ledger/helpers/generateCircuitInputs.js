const fs = require("fs");
const path = require("path");
const circomlibjs = require("circomlibjs");

// === GET ARGUMENTS ===
const bankId = parseInt(process.argv[2]);
const ssn = "1488";
const month = 202504;

if (isNaN(bankId)) {
    console.error("❌ Please provide a valid bank ID");
    process.exit(1);
}

const staticPath = `data/bank${bankId}/static/${ssn}_${month}.json`;
const txPath = `data/bank${bankId}/transactions/${ssn}_${month}.json`;
const saltPath = `data/bank${bankId}/salts/${ssn}.json`;
const outputPath = `data/bank${bankId}/pdata/${ssn}_${month}.json`;

// === LOAD FILES ===
if (!fs.existsSync(staticPath) || !fs.existsSync(txPath) || !fs.existsSync(saltPath)) {
    console.error("❌ Missing one or more input files");
    process.exit(1);
}

const staticData = JSON.parse(fs.readFileSync(staticPath, "utf8"));
const txData = JSON.parse(fs.readFileSync(txPath, "utf8"));
const { salt } = JSON.parse(fs.readFileSync(saltPath, "utf8"));

(async () => {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    const ssnBig = BigInt(ssn);
    const saltBig = BigInt(salt);

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

    const staticCommitment = F.toObject(poseidon(staticInputs)).toString();
    const txCommitment = F.toObject(poseidon(txInputs)).toString();

    // === pdata array ===
    const pdata = [
        staticData.kyc,
        staticData.expectedIncome,
        staticData.creditScore,
        staticData.accountTenure,
        staticData.creditLimit,
        staticData.creditAmount,
        staticData.pep,
        txData.totalIncome,
        txData.numRefunds,
        txData.numTx,
        txData.numHRC,
        txData.numCountries
    ];

    // === Final input format ===
    const circuitInput = {
        ssn: ssnBig.toString(),
        salt: saltBig.toString(),
        pdata: pdata.map(n => n.toString()),
        staticCommitment,
        txCommitment
    };

    // === SAVE ===
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(circuitInput, null, 2));
    console.log(`✅ Circuit input saved to ${outputPath}`);
})();

const fs = require("fs");
const path = require("path");
const circomlibjs = require("circomlibjs");
const { ethers } = require("ethers");

// === GET ARGUMENTS ===
const bankId = parseInt(process.argv[2]);
const ssn = "1488";
const month = 202504;

if (isNaN(bankId)) {
    console.error("provide a valid bank ID");
    process.exit(1);
}

const base = `data/bank${bankId}`;

const staticPath = `${base}/static/${ssn}_${month}.json`;
const txPath = `${base}/transactions/${ssn}_${month}.json`;
const clientSaltPath = `${base}/salts/${ssn}.json`;

const rfPath = `${base}/prf/prf_${month}.json`;
const rfSaltPath = `${base}/salts/prf.json`;

const outputPath = `${base}/pdata/${ssn}_${month}.json`;

// === LOAD FILES ===
if (![staticPath, txPath, clientSaltPath, rfPath, rfSaltPath].every(fs.existsSync)) {
    console.error("Missing one or more input files");
    process.exit(1);
}

const staticData = JSON.parse(fs.readFileSync(staticPath, "utf8"));
const txData = JSON.parse(fs.readFileSync(txPath, "utf8"));
const { salt: clientSalt } = JSON.parse(fs.readFileSync(clientSaltPath, "utf8"));
const rfData = JSON.parse(fs.readFileSync(rfPath, "utf8"));
const { salt: prfSalt } = JSON.parse(fs.readFileSync(rfSaltPath, "utf8"));

(async () => {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    const ssnBig = BigInt(ssn);
    const clientSaltBig = BigInt(clientSalt);
    const prfSaltBig = BigInt(prfSalt);
    const prfBig = BigInt(rfData.prf);
    //const prfScaled = BigInt(Math.round(Number(rfData.prf)* 10000));


    // === Static commitment
    const staticInputs = [
        ssnBig,
        BigInt(staticData.kyc),
        BigInt(staticData.expectedIncome),
        BigInt(staticData.creditScore),
        BigInt(staticData.accountTenure),
        BigInt(staticData.creditLimit),
        BigInt(staticData.creditAmount),
        BigInt(staticData.pep),
        clientSaltBig
    ];
    const staticCommitment = F.toObject(poseidon(staticInputs)).toString();

    // === Tx commitment
    const txInputs = [
        ssnBig,
        BigInt(txData.totalIncome),
        BigInt(txData.numRefunds),
        BigInt(txData.numTx),
        BigInt(txData.numHRC),
        BigInt(txData.numCountries),
        clientSaltBig
    ];
    const txCommitment = F.toObject(poseidon(txInputs)).toString();

    // === RF commitment
    const rfInputs = [prfBig, prfSaltBig];
    const prfCommitment = F.toObject(poseidon(rfInputs)).toString();

    // === Full client profile input array (length 12)
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

    const circuitInput = {
        ssn: ssnBig.toString(),
        client_salt: clientSaltBig.toString(),
        prf_salt: prfSaltBig.toString(),
        pdata: pdata.map(v => v.toString()),
        prf_pdata: prfBig.toString(),
        staticCommitment,
        txCommitment,
        prfCommitment
    };

    const staticCommitmentHex = ethers.utils.hexZeroPad("0x" + F.toObject(poseidon(staticInputs)).toString(16), 32);
    const txCommitmentHex = ethers.utils.hexZeroPad("0x" + F.toObject(poseidon(txInputs)).toString(16), 32);
    const prfCommitmentHex = ethers.utils.hexZeroPad("0x" + F.toObject(poseidon(rfInputs)).toString(16), 32);


    console.log("Static commitment: ", staticCommitmentHex);
    console.log("Tx commitment:     ", txCommitmentHex);
    console.log("Prf commitment:    ", prfCommitmentHex);    


    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(circuitInput, null, 2));
    console.log(`Circuit input (with PRF) saved to ${outputPath}`);
})();

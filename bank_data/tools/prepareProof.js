// prepareProof.js
const fs = require('fs');
const path = require('path');

function loadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error(`Error reading file at ${filePath}: ${err.message}`);
        process.exit(1);
    }
}

function prepareProof(bankId, proofType) {
    const basePath = path.join('backend', 'zk', 'zk-circuits', 'build', bankId, proofType);
    const proof = loadJson(path.join(basePath, 'proof.json'));
    const pub = loadJson(path.join(basePath, 'public.json'));

    const a = [proof.pi_a[0], proof.pi_a[1]];
    const b = [
        [proof.pi_b[0][0], proof.pi_b[0][1]],
        [proof.pi_b[1][0], proof.pi_b[1][1]]
    ];
    const c = [proof.pi_c[0], proof.pi_c[1]];
    const publicSignals = pub.map((x) => x.toString());

    const proofData = {
        a,
        b,
        c,
        publicSignals
    };

    const outputDir = path.join('bank_data', 'proofs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${bankId}_${proofType}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(proofData, null, 2), 'utf8');
    console.log(`Proof saved to ${outputPath}`);
}

// CLI runner
if (require.main === module) {
    const [bankId, proofType] = process.argv.slice(2);
    if (!bankId || !['incomes', 'risks'].includes(proofType)) {
        console.error('Usage: node prepareProof.js <bankId> <incomes|risks>');
        process.exit(1);
    }
    prepareProof(bankId, proofType);
}

module.exports = prepareProof;

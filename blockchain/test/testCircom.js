const fs = require("fs");
const path = require("path");
const { buildPoseidon } = require("circomlibjs");
const { unstringifyBigInts } = require("ffjavascript");
const wc = require("../circuits/build/input_js/witness_calculator.js");

async function test() {
    const wasmPath = path.join(__dirname, "../circuits/build/input_js/input.wasm");
    const wasmBuffer = fs.readFileSync(wasmPath);

    const witnessCalculator = await wc(wasmBuffer);

    const poseidon = await buildPoseidon();

    // Simulate your inputs
    const ssn = "1488";
    const salt = BigInt("0x1029876933e636971f7c608d8c650477f43538e614306da51de0fb85774123f2");

    const pdata = [
        3,
        3200,
        680,
        24,
        10000,
        4000,
        0,
        5000,
        2,
        12,
        3,
        5
    ];

    // Recompute expected hashes (JS side)
    const staticHash = poseidon.F.toObject(
        poseidon([BigInt(ssn), ...pdata.slice(0, 7).map(BigInt), salt])
    );

    const txHash = poseidon.F.toObject(
        poseidon([BigInt(ssn), ...pdata.slice(7).map(BigInt), salt])
    );

    const input = {
        ssn: ssn.toString(),
        salt: salt.toString(),
        pdata: pdata.map(n => n.toString()),
        staticCommitment: staticHash.toString(),
        txCommitment: txHash.toString()
    };

    console.log("Input:", input);

    const buffWitness = await witnessCalculator.calculateWTNSBin(input, 0);
    fs.writeFileSync("circuits/build/witness_debug.wtns", buffWitness);
    console.log("✅ Witness generated and saved to witness_debug.wtns");
}

test().catch(console.error);

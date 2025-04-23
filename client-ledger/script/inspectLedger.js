const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

// === CONFIGURATION ===
const REGULATOR_SIGNER_INDEX = 0;
const BANK_START_INDEX = 0;
const TOTAL_BANKS = 3;
const MONTH = 202504;

async function main() {
    const contractMeta = JSON.parse(fs.readFileSync("artifacts/contracts/ClientLedger.json", "utf8"));
    const contract = new ethers.Contract(contractMeta.address, contractMeta.abi, provider);

    const regulator = provider.getSigner(REGULATOR_SIGNER_INDEX);
    const regulatorAddress = await regulator.getAddress();

    console.log(`Using AML Regulator (${regulatorAddress}) to inspect banks...\n`);

    const connectedAsRegulator = contract.connect(regulator);

    for (let i = BANK_START_INDEX; i < BANK_START_INDEX + TOTAL_BANKS; i++) {
        const bankSigner = provider.getSigner(i);
        const bankAddr = await bankSigner.getAddress();

        const isAuthorized = await contract.isBank(bankAddr);
        console.log(`Bank ${i} (${bankAddr})`);
        console.log(`• Authorized: ${isAuthorized}`);

        if (!isAuthorized) {
            console.log("• Skipping (not authorized)");
            console.log("-------------------------------------------------");
            continue;
        }

        try {
            const [staticHash, staticMeta] = await connectedAsRegulator.getStaticCommitment(bankAddr, MONTH);
            console.log(`• Static Commitment: ${staticHash}`);
            console.log(`• Static Metadata  : ${staticMeta}`);
        } catch (err) {
            console.log("• Static Commitment: Not set");
        }

        try {
            const [txHash, txMeta] = await connectedAsRegulator.getTxCommitment(bankAddr, MONTH);
            console.log(`• TX Commitment    : ${txHash}`);
            console.log(`• TX Metadata      : ${txMeta}`);
        } catch (err) {
            console.log("• TX Commitment    : Not set");
        }

        try {
            const [rfHash, rfMeta] = await connectedAsRegulator.getRFCommitment(bankAddr, MONTH);
            console.log(`• RF Commitment    : ${rfHash}`);
            console.log(`• RF Metadata      : ${rfMeta}`);
        } catch (err) {
            console.log("• RF Commitment    : Not set");
        }

        console.log("-------------------------------------------------");
    }

    console.log("Inspection complete.");
}

main().catch(console.error);

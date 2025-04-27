const { ethers } = require("ethers");
const fs = require("fs");

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

// === CONFIGURATION ===
const BANK_START_INDEX = 0;
const TOTAL_BANKS = 3;
const MONTH = 202504;

async function main() {
    const contractMeta = JSON.parse(fs.readFileSync("artifacts/contracts/ClientLedger.json", "utf8"));
    const contract = new ethers.Contract(contractMeta.address, contractMeta.abi, provider);

    console.log("Inspecting all banks...\n");

    for (let i = BANK_START_INDEX; i < BANK_START_INDEX + TOTAL_BANKS; i++) {
        const bankSigner = provider.getSigner(i);
        const bankAddr = await bankSigner.getAddress();

        console.log(`Bank ${i} (${bankAddr})`);

        // Static Commitment
        try {
            const [staticHash, staticMeta] = await contract.getStaticCommitment(bankAddr, MONTH);
            if (staticHash === ethers.constants.HashZero) {
                console.log("• Static Commitment: Not set");
            } else {
                console.log(`• Static Commitment: ${staticHash}`);
                console.log(`• Static Metadata  : ${staticMeta}`);
            }
        } catch (err) {
            console.log("• Static Commitment: Not set (error)");
        }

        // TX Commitment
        try {
            const [txHash, txMeta] = await contract.getTxCommitment(bankAddr, MONTH);
            if (txHash === ethers.constants.HashZero) {
                console.log("• TX Commitment    : Not set");
            } else {
                console.log(`• TX Commitment    : ${txHash}`);
                console.log(`• TX Metadata      : ${txMeta}`);
            }
        } catch (err) {
            console.log("• TX Commitment    : Not set (error)");
        }

        // RF Commitment
        try {
            const [rfHash, rfMeta] = await contract.getRFCommitment(bankAddr, MONTH);
            if (rfHash === ethers.constants.HashZero) {
                console.log("• RF Commitment    : Not set");
            } else {
                console.log(`• RF Commitment    : ${rfHash}`);
                console.log(`• RF Metadata      : ${rfMeta}`);
            }
        } catch (err) {
            console.log("• RF Commitment    : Not set (error)");
        }

        console.log("-------------------------------------------------");
    }

    console.log("Inspection complete.");
}

main().catch(console.error);

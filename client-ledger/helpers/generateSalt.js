const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// === CONFIG ===
const saltLengthBytes = 32;
const ssn = "prf"; // Fixed identifier for P(RF)

// === HELPERS ===
function generateSalt() {
    const randomBytes = ethers.utils.randomBytes(saltLengthBytes);
    return ethers.utils.hexlify(randomBytes);
}

function saveSalt(bankId, ssn, salt) {
    const dir = path.join("data", `bank${bankId}`, "salts");
    const file = path.join(dir, `${ssn}.json`);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const payload = { salt };
    fs.writeFileSync(file, JSON.stringify(payload, null, 2));
    console.log(`✅ Salt saved to ${file}`);
}

// === MAIN ===
function main() {
    const bankId = process.argv[2];

    if (!bankId) {
        console.error("❌ Please provide a bank ID as an argument");
        process.exit(1);
    }

    const salt = generateSalt();
    console.log("Generated salt:", salt);
    saveSalt(bankId, ssn, salt);
}

main();

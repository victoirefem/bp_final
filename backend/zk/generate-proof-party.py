import os
import sys
import subprocess

def run(cmd, cwd=None):
    print(f"\nRunning: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print("Command failed.")
        sys.exit(1)

# === Validate input ===
if len(sys.argv) != 2:
    print("Usage: python generate-proof-party.py <bankId>")
    sys.exit(1)

bank_id = sys.argv[1]

# === Set up paths ===
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # backend/
ZK_DIR = os.path.join(ROOT, "zk")
CIRCUIT_DIR = os.path.join(ZK_DIR, "circuits")
CIRCUIT_SRC = os.path.join(CIRCUIT_DIR, "circom", f"txcheck_{bank_id}.circom")
BUILD_DIR = os.path.join(CIRCUIT_DIR, "build", bank_id)
PTAU = os.path.join(CIRCUIT_DIR, "ptau", "pot10.ptau")
ZKEY = os.path.join(BUILD_DIR, "txcheck.zkey")
VERIF_KEY = os.path.join(BUILD_DIR, "verification_key.json")
PRIV_INPUT = os.path.join(ZK_DIR, "zk-inputs", f"{bank_id}_incomes.json")
PROOF = os.path.join(BUILD_DIR, "proof.json")
PUBLIC = os.path.join(BUILD_DIR, "public.json")
WITNESS = os.path.join(BUILD_DIR, "witness.wtns")
WASM_DIR = os.path.join(BUILD_DIR, "txcheck_20_js")

# === Ensure build dir exists ===
os.makedirs(BUILD_DIR, exist_ok=True)

# === Step 1: Compile circuit ===
run(f"circom {CIRCUIT_SRC} --r1cs --wasm --sym -o {BUILD_DIR}")
print("Step 1: Compile circuit")

# === Step 2: Setup ===
run(f"snarkjs groth16 setup {BUILD_DIR}/txcheck_20.r1cs {PTAU} {ZKEY}")
print("Step 2: Setup")

# === Step 3: Export verification key ===
run(f"snarkjs zkey export verificationkey {ZKEY} {VERIF_KEY}")
print("Step 3: Export verification key")

# === Step 4: Generate witness ===
run(f"node {WASM_DIR}/generate_witness.js {WASM_DIR}/txcheck_20.wasm {PRIV_INPUT} {WITNESS}")
print("Step 4: Generate witness")

# === Step 5: Generate proof ===
run(f"snarkjs groth16 prove {ZKEY} {WITNESS} {PROOF} {PUBLIC}")
print("Step 5: Generate proof")

# === Step 6: Verify proof ===
run(f"snarkjs groth16 verify {VERIF_KEY} {PUBLIC} {PROOF}")
print("Step 6: Verify proof")

print("\nProof generation and verification completed.")

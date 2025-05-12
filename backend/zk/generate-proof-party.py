import os
import sys
import subprocess

def run(cmd, cwd=None):
    print(f"\nRunning: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print("Command failed.")
        sys.exit(1)

if len(sys.argv) != 3:
    print("Usage: python generate-proof-party.py <bankId> <i|r>")
    sys.exit(1)

bank_id = sys.argv[1]
mode = sys.argv[2].lower()

if mode not in ["i", "r"]:
    print("Invalid mode. Use 'i' for income or 'r' for risk.")
    sys.exit(1)

is_income = mode == "i"
prefix = "txcheck" if is_income else "riskcheck"
input_tag = "incomes" if is_income else "risks"

# Paths
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # backend/
ZK_DIR = os.path.join(ROOT, "zk")
CIRCUIT_DIR = os.path.join(ZK_DIR, "zk-circuits")
CIRCUIT_SRC = os.path.join(CIRCUIT_DIR, "circom", bank_id, f"{prefix}.circom")
BUILD_DIR = os.path.join(CIRCUIT_DIR, "build", bank_id, input_tag)
PTAU = os.path.join(CIRCUIT_DIR, "ptau", "pot10.ptau")
ZKEY = os.path.join(BUILD_DIR, f"{prefix}.zkey")
VERIF_KEY = os.path.join(BUILD_DIR, "verification_key.json")
PRIV_INPUT = os.path.join(ZK_DIR, "zk-inputs", f"{bank_id}_{input_tag}.json")
PROOF = os.path.join(BUILD_DIR, "proof.json")
PUBLIC = os.path.join(BUILD_DIR, "public.json")
WITNESS = os.path.join(BUILD_DIR, "witness.wtns")
WASM_DIR = os.path.join(BUILD_DIR, f"{prefix}_js")

# === Ensure build dir exists ===
os.makedirs(BUILD_DIR, exist_ok=True)

# === Step 1: Compile circuit ===
run(f"circom {CIRCUIT_SRC} --r1cs --wasm --sym -o {BUILD_DIR}")
print("Step 1: Circuit compiled")

# === Step 2: Setup ===
run(f"snarkjs groth16 setup {BUILD_DIR}/{prefix}.r1cs {PTAU} {ZKEY}")
print("Step 2: Setup complete")

# === Step 3: Export verification key ===
run(f"snarkjs zkey export verificationkey {ZKEY} {VERIF_KEY}")
print("Step 3: Verification key exported")

# === Step 4: Generate witness ===
run(f"node {WASM_DIR}/generate_witness.js {WASM_DIR}/{prefix}.wasm {PRIV_INPUT} {WITNESS}")
print("Step 4: Witness generated")

# === Step 5: Generate proof ===
run(f"snarkjs groth16 prove {ZKEY} {WITNESS} {PROOF} {PUBLIC}")
print("Step 5: Proof generated")

# === Step 6: Verify proof ===
run(f"snarkjs groth16 verify {VERIF_KEY} {PUBLIC} {PROOF}")
print("Step 6: Proof verified")

# print("\nProof generation and verification completed successfully")

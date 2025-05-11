import os
import subprocess
import sys
import time

def run(cmd, cwd=None):
    print(f"\nRunning: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print("Command failed.")
        sys.exit(1)

# === Hardcoded parameters ===
bank_id = "20"
mode = "i"

is_income = mode == "i"
prefix = "txcheck" if is_income else "riskcheck"
input_tag = "incomes" if is_income else "risks"

# === Validate input ===
if len(sys.argv) != 2:
    print("Usage: python proofs-generate.py <n>")
    sys.exit(1)

try:
    n = int(sys.argv[1])
except ValueError:
    print("Invalid n: must be an integer")
    sys.exit(1)


# === Set up paths ===
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # backend/
ZK_DIR = os.path.join(ROOT, "zk")
CIRCUIT_DIR = os.path.join(ZK_DIR, "zk-circuits")
CIRCUIT_SRC = os.path.join(CIRCUIT_DIR, "circom", "proofs", bank_id, f"{prefix}.circom")
BUILD_DIR = os.path.join(CIRCUIT_DIR, "build", "proofs", bank_id, input_tag)
PTAU = os.path.join(CIRCUIT_DIR, "ptau", "pot10.ptau")
ZKEY = os.path.join(BUILD_DIR, f"{prefix}.zkey")
VERIF_KEY = os.path.join(BUILD_DIR, "verification_key.json")
PRIV_INPUT = os.path.join(ZK_DIR, "zk-inputs", f"{bank_id}_proofs.json")
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

total_start = time.time()

# === Step 5: Generate proof ===
run(f"snarkjs groth16 prove {ZKEY} {WITNESS} {PROOF} {PUBLIC}")
print("Step 5: Proof generated")

total_end = time.time()

# === Step 6: Verify proof ===
run(f"snarkjs groth16 verify {VERIF_KEY} {PUBLIC} {PROOF}")
print("Step 6: Proof verified")

elapsed = total_end - total_start
print(f"⏱ Total ZK pipeline time for {n} rows: {elapsed:.3f} seconds")

with open("proof_benchmark.txt", "a") as f:
    f.write(f"{n},{elapsed:.4f}\n")




print("\n✅ Proof generation and verification completed successfully.")

import subprocess
import sys

def run_command(command, shell=False):
    print(f"\nRunning: {' '.join(command) if isinstance(command, list) else command}")
    result = subprocess.run(command, shell=shell)
    if result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)

def main():
    try:
        n = int(input("Enter the number of rows to record as commitments: ").strip())
    except ValueError:
        print("Invalid input: please enter an integer.")
        return

    # Step 1: Hash and extract N rows
    run_command(["node", "bank_data/tools/hashClientsProof.js", str(n)])

    # Step 2: Deploy contracts
    run_command(["node", "blockchain/scripts/deploy.js"])

    # Step 3: Record transactions
    run_command(["node", "blockchain/scripts/recordForProofs.js"])

    # Step 4: Prepare input JSON for proof
    run_command(["python3", "backend/pdata/proofs-pdata.py", str(n)])

    # Step 5: get commitments
    run_command(["node", "backend/zk/proofs-get-commitments.js"])

    # Step 6: get private data
    run_command(["node", "backend/zk/proofs-get-private.js"])

    # Step 7: generate circuit
    run_command(["python3", "backend/zk/proofs-circuit.py"])

    # Step 8: generate proof
    run_command(["python3", "backend/zk/proofs-generate.py", str(n)])


    print("\n✅ Pipeline completed successfully.")

if __name__ == "__main__":
    main()

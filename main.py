import os
import pandas as pd
import subprocess
import json


def run_zk(bank_id, data_type, bank_address, private_key):
    result = subprocess.run(
        ["node", "backend/scripts/run-zk.js", bank_id, data_type, bank_address, private_key],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Failed to generate ZK proof for bank {bank_id}:")
        print(result.stderr)
        exit(1)


def generate_pdata(bank_id, client_id, data_type):
    result = subprocess.run(
        ["python3", "backend/pdata/generate-pdata.py", bank_id, client_id, data_type],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Failed to generate pdata for bank {bank_id}:")
        print(result.stderr)
        exit(1)


def start_session(session_id, init_bank_address, init_bank_private_key):
    print(f"6: Starting session {session_id} on-chain...")
    result = subprocess.run(
        ["node", "blockchain/scripts/start.js", session_id, init_bank_address, init_bank_private_key],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("Error starting session:")
        print(result.stderr)
        exit(1)
    else:
        print(result.stdout)


def join_session(session_id, invited_bank_addrs_keys):
    print(f"5: Invited banks joining session {session_id}...")
    args = ["node", "blockchain/scripts/join.js", session_id]
    for address, privkey in invited_bank_addrs_keys:
        args += [address, privkey]
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        print("Error during session joining:")
        print(result.stderr)
        exit(1)
    else:
        print(result.stdout)


def create_session(init_bank_address, init_bank_private_key):
    print("4: Creating session on-chain...")
    result = subprocess.run(
        ["node", "blockchain/scripts/create.js", init_bank_address, init_bank_private_key],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("Error creating session:")
        print(result.stderr)
        exit(1)
    
    print(result.stdout)
    for line in result.stdout.splitlines():
        if line.strip().startswith("Session ID:"):
            return line.strip().split(":")[1].strip()
    print("Warning: Session ID not found in output.")
    return None


def record_risks(client_id):
    result = subprocess.run(["node", "blockchain/scripts/recordRisks.js", client_id], capture_output=True, text=True)
    if result.returncode != 0:
        print("Error recording risks:")
        print(result.stderr)
        exit(1)


def record_transactions(client_id):
    result = subprocess.run(["node", "blockchain/scripts/recordTxs.js", client_id], capture_output=True, text=True)
    if result.returncode != 0:
        print("Error recording transactions:")
        print(result.stderr)
        exit(1)


def generate_bank_map(init_bank_id, invited_bank_ids):
    args = ["node", "bank_data/tools/generateBankMap.js", "--init", init_bank_id, "--j"] + invited_bank_ids
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        print("Error generating bank map:")
        print(result.stderr)
        exit(1)
    else:
        print("2: Bank address map generated successfully")


def deploy_contracts():
    print("Deploying smart contracts...")
    result = subprocess.run(["node", "blockchain/scripts/deploy.js"], capture_output=True, text=True)
    if result.returncode != 0:
        print("Error during contract deployment:")
        print(result.stderr)
        exit(1)
    else:
        print(result.stdout)


def hash_client(bank_id, client_id):
    result = subprocess.run(
        ["node", "bank_data/tools/hashClients.js", bank_id, client_id],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print("Error hashing client:")
        print(result.stderr)
        exit(1)


def hash_clients_for_banks(grouped_accounts):
    for from_bank, accounts in grouped_accounts.items():
        args = ["node", "bank_data/tools/hashClients.js", from_bank] + list(accounts)
        result = subprocess.run(args, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error hashing for bank {from_bank}:")
            print(result.stderr)
            exit(1)


def main():
    print("=== Risk Computation Coordinator ===")

    deploy_contracts()

    init_bank_id = input("Enter init bank ID: ").strip()
    client_id = input("Enter client ID: ").strip()

    income_path = os.path.join("bank_data", "raw", f"{init_bank_id}_income.csv")
    if not os.path.exists(income_path):
        print(f"Income data file not found: {income_path}")
        return

    df_income = pd.read_csv(income_path, dtype=str)
    required_cols = {"To Account", "From Bank", "From Account"}
    if not required_cols.issubset(df_income.columns):
        print(f"CSV must contain columns: {', '.join(required_cols)}")
        return

    filtered = df_income[
        (df_income["To Account"] == client_id) &
        (df_income["From Bank"] != init_bank_id)
    ]

    if filtered.empty:
        print(f"No transactions from other banks to client '{client_id}' found.")
        return

    risk_path = os.path.join("bank_data", "raw", f"{init_bank_id}_risks.csv")
    if not os.path.exists(risk_path):
        print(f"Risk score file not found: {risk_path}")
        return

    df_risks = pd.read_csv(risk_path, dtype=str)
    if "Account" not in df_risks.columns or "Risk Score" not in df_risks.columns:
        print(f"Risk CSV must contain 'Account' and 'Risk Score'")
        return

    matching_risk = df_risks[df_risks["Account"] == client_id]
    if matching_risk.empty:
        print(f"No risk score entry found for client '{client_id}' in bank {init_bank_id}")
        return

    current_score = matching_risk.iloc[0]["Risk Score"]
    print(f"\nRisk score for client '{client_id}': {current_score}")

    print(f"\nFound {len(filtered)} transaction(s) to client '{client_id}' from other banks.")
    grouped = filtered.groupby("From Bank")["From Account"].unique()

    print("\n=== Invited Banks and Involved Accounts ===")
    for from_bank, accounts in grouped.items():
        print(f"From Bank {from_bank}:")
        for acc in accounts:
            print(f"  - {acc}")

    response = input("\nDo you want to update the risk score for this client? (y/n): ").strip().lower()
    if response != "y":
        print("Aborting. No update will be performed.")
        return

    hash_client(init_bank_id, client_id)
    hash_clients_for_banks(grouped)
    print("1: All data hashed successfully")

    invited_bank_ids = list(grouped.index.astype(str))
    generate_bank_map(init_bank_id, invited_bank_ids)
    record_transactions(client_id)
    record_risks(client_id)
    print("3: All data recorded successfully")

    # Load address/key maps once and cache them
    address_map = json.load(open("bank_data/wallets/bank_address_map.json"))
    key_map = json.load(open("bank_data/wallets/bank_private_keys.json"))

    signers = {}
    all_bank_ids = [init_bank_id] + invited_bank_ids
    for bank_id in all_bank_ids:
        address = address_map[bank_id]
        private_key = next(
            key for addr, key in key_map.items() if addr.lower() == address.lower()
        )
        signers[bank_id] = {"address": address, "private_key": private_key}

    session_id = create_session(signers[init_bank_id]["address"], signers[init_bank_id]["private_key"])
    if not session_id:
        print("Cannot proceed without a valid session ID.")
        return

    invited_bank_addrs_keys = [
        (signers[bank_id]["address"], signers[bank_id]["private_key"]) for bank_id in invited_bank_ids
    ]
    join_session(session_id, invited_bank_addrs_keys)
    start_session(session_id, signers[init_bank_id]["address"], signers[init_bank_id]["private_key"])

    print("7: Generating ZK/MPC input data (pdata)...")
    generate_pdata(init_bank_id, client_id, "i")
    for bank_id, client_ids in grouped.items():
        for account_id in client_ids:
            generate_pdata(bank_id, account_id, "r")

    print("8: Running ZK proof generation...")
    run_zk(init_bank_id, "i", signers[init_bank_id]["address"], signers[init_bank_id]["private_key"])
    for bank_id in invited_bank_ids:
        run_zk(bank_id, "r", signers[bank_id]["address"], signers[bank_id]["private_key"])


if __name__ == "__main__":
    main()

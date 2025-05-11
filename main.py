import os
import pandas as pd
import subprocess
import json

def prepare_and_publish_proof(bank_id, proof_type, address, private_key, session_id):
    # Step 1: Prepare the proof using prepareProof.js
    result = subprocess.run(
        ["node", "bank_data/tools/prepareProof.js", bank_id, proof_type],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Failed to prepare proof for {bank_id} ({proof_type})")
        print(result.stderr)
        return

    proof_file = f"bank_data/proofs/{bank_id}_{proof_type}.json"
    if not os.path.exists(proof_file):
        print(f"Expected proof file not found: {proof_file}")
        return

    # Step 2: Publish proof using publishProof.js
    args = [
        "node", "blockchain/scripts/publishProof.js",
        str(session_id),
        address,
        private_key,
        proof_type
    ]
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Failed to publish proof for {bank_id}:")
        print(result.stderr)
    else:
        print(f"Proof published for {bank_id}")





def run_zk(bank_id, data_type, bank_address, private_key):
    result = subprocess.run(
        ["node", "backend/scripts/run-zk.js", bank_id, data_type, bank_address, private_key],
        capture_output=True,
        text=True
    )
    # print(result.stdout)
    if result.returncode != 0:
        print(f"Failed to generate ZK proof for bank {bank_id}:")
        print(result.stderr)
        exit(1)
    # else:
    #     print(f"ZK proof generated for bank {bank_id}")


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
    print(f"(All banks joined the session, triggering initiator bank to start...)")
    print(f"\n--> Starting a session {session_id}...")
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
    print(f"--> Invited banks are joining session {session_id}...")
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
    print("--> Creating a session...")
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


def record_risks(bank_id, client_id, private_key):
    result = subprocess.run(
        ["node", "blockchain/scripts/recordRisks.js", bank_id, client_id, private_key],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Error recording risks for bank {bank_id}, client {client_id}:")
        print(result.stderr)
        exit(1)



def record_transactions(bank_id, client_id, private_key):
    result = subprocess.run(
        ["node", "blockchain/scripts/recordTxs.js", bank_id, client_id, private_key],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Error recording transactions for bank {bank_id}:")
        print(result.stderr)
        exit(1)



def generate_bank_map(init_bank_id, invited_bank_ids):
    args = ["node", "bank_data/tools/generateBankMap.js", "--init", init_bank_id, "--j"] + invited_bank_ids
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        print("Error generating bank map:")
        print(result.stderr)
        exit(1)
    # else:
    #     print("2: Bank -> address mapping generated")


def deploy_contracts():
    print("Deploying smart contracts...")
    result = subprocess.run(["node", "blockchain/scripts/deploy.js"], capture_output=True, text=True)
    if result.returncode != 0:
        print("Error during contract deployment:")
        print(result.stderr)
        exit(1)
    else:
        print(result.stdout)
        print()


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
    print("=== Risk Computation Session ===")

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
    
    
    invited_bank_ids = list(grouped.index.astype(str))
    all_bank_ids = [init_bank_id] + invited_bank_ids

    generate_bank_map(init_bank_id, invited_bank_ids)

    # Load address/key maps once and cache them
    address_map = json.load(open("bank_data/wallets/bank_address_map.json"))
    key_map = json.load(open("bank_data/wallets/bank_private_keys.json"))

    

    # Build the signers dictionary first
    signers = {}
    for bank_id in all_bank_ids:
        address = address_map[bank_id]
        private_key = next(
            key for addr, key in key_map.items() if addr.lower() == address.lower()
        )
        signers[bank_id] = {"address": address, "private_key": private_key}

    # Now it's safe to use signers
    invited_bank_addrs_keys = [
        (signers[bank_id]["address"], signers[bank_id]["private_key"]) for bank_id in invited_bank_ids
    ]

    # Continue with hashing and recording
    hash_client(init_bank_id, client_id)
    hash_clients_for_banks(grouped)
    # print("\n--> All banks have their hashed data ready")

    

    print("\n=== TxLedger / RiskLedger SCs ===")
    record_transactions(init_bank_id, client_id, signers[init_bank_id]["private_key"])

    for bank_id, client_ids in grouped.items():
        for account_id in client_ids:
            record_risks(bank_id, account_id, signers[bank_id]["private_key"])


    print("(All banks have their transactions and risks recorded on-chain)")
    print("===")

    print("\n=== Session SC ===")

    session_id = create_session(signers[init_bank_id]["address"], signers[init_bank_id]["private_key"])
    if not session_id:
        print("Cannot proceed without a valid session ID.")
        return
    print("===")
    
    print("\n=== OFF-CHAIN communication ===")
    print("(Generating mpc_settings.json, circuit_info.json and hosts...)")
    # print("Generating MPC settings...")

    # For init bank: number of inputs = total risks (across invited banks) + 1
    input_counts = [len(accounts) for accounts in grouped.values]
    invited_ids_csv = ",".join(invited_bank_ids)
    inputs_csv = ",".join(str(x) for x in input_counts)

    subprocess.run(
        ["python3", "backend/mpc/generate-mpc-settings.py", init_bank_id, invited_ids_csv, inputs_csv],
        check=True
    )

    ### UNCOMMENT
    subprocess.run(
        ["python3", "backend/mpc/generate-circuit-info.py"],
        check=True
    )

    # Write HOSTS file for MP-SPDZ
    # print("Configuring MP-SPDZ/HOSTS file...")

    mpc_settings_path = "backend/mpc/mpc-config/mpc_settings.json"
    with open(mpc_settings_path) as f:
        mpc_settings = json.load(f)

    num_parties = len(mpc_settings)
    hosts_path = "MP-SPDZ/HOSTS"

    with open(hosts_path, "w") as f:
        for i in range(num_parties):
            port = 5000 + i
            f.write(f"127.0.1.1:{port}\n")

    # print(f"HOSTS file written with {num_parties} parties.")

    print("--> Sending MPC config files to invited banks...")
    print("===")

    print("\n=== Session SC ===")
    join_session(session_id, invited_bank_addrs_keys)
    start_session(session_id, signers[init_bank_id]["address"], signers[init_bank_id]["private_key"])

    print("(All banks received the session start event, starting ZK + MPC...)")
    print("===")

    generate_pdata(init_bank_id, client_id, "i")
    for bank_id, client_ids in grouped.items():
        for account_id in client_ids:
            generate_pdata(bank_id, account_id, "r")

    # print("8: Banks generate their ZK proofs...")
    # UNCOMMENT
    print("\n=== ZKP + MPC ===")
    run_zk(init_bank_id, "i", signers[init_bank_id]["address"], signers[init_bank_id]["private_key"])
    for bank_id in invited_bank_ids:
        run_zk(bank_id, "r", signers[bank_id]["address"], signers[bank_id]["private_key"])
    print("--> All banks generated their ZKPs")

    # print("Generating MPC input files...")

    subprocess.run(
        ["python3", "backend/mpc/generate-mpc-inputs.py", init_bank_id, invited_ids_csv, inputs_csv],
        check=True
    )

    total_parties = 1 + len(invited_bank_ids)  # init + invited

    
    print("--> Starting MPC...")

    processes = []
    for party_id in range(total_parties):
        # print(f"Launching party {party_id}")
        proc = subprocess.Popen(
            ["python3", "backend/mpc/run-risk-party.py", str(party_id)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        processes.append((party_id, proc))

    # Optional: Wait for all to complete and report status
    # for party_id, proc in processes:
    #     stdout, stderr = proc.communicate()
    #     # print(f"\n=== Party {party_id} finished ===")
    #     # print(stdout.decode())
    #     if proc.returncode != 0:
    #         print(f"Error in party {party_id}:\n{stderr.decode()}")

    # === Step: Extract R_part from party 0 result
    r_part = None

    for party_id, proc in processes:
        stdout, stderr = proc.communicate()
        if party_id == 0:
            for line in stdout.decode().splitlines():
                if "R_part:" in line:
                    try:
                        r_part = float(line.split("R_part:")[1].strip())
                    except ValueError:
                        pass

    if r_part is None:
        print("Could not extract R_part from MPC output of party 0.")
        exit(1)

    # === Compute final updated risk
    # print(float(current_score))
    # print(r_part)
    updated_risk = 0.5 * float(current_score) + r_part

    print(f"\n Calculating the final risk score...")
    print(f"Result: {updated_risk:.6f}")
    print(f"Increased by (%): {100 * (updated_risk - float(current_score)) / (updated_risk):.2f}%")
    print("===")

    print("\n=== Session SC ===")
    print("--> Parties are publishing their proofs...")
    # Publish initiator proof
    prepare_and_publish_proof(
        init_bank_id, "incomes",
        signers[init_bank_id]["address"], signers[init_bank_id]["private_key"],
        session_id
    )

    # Publish invited banks' proofs
    for bank_id in invited_bank_ids:
        prepare_and_publish_proof(
            bank_id, "risks",
            signers[bank_id]["address"], signers[bank_id]["private_key"],
            session_id
        )

    print("\n(All banks published their proofs, triggering initiator bank to resolve...)\n")

    result = subprocess.run(
        ["node", "blockchain/scripts/finish.js",
        str(session_id),
        signers[init_bank_id]["address"],
        signers[init_bank_id]["private_key"]],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("Failed to finish session:")
        print(result.stderr)
    else:
        print(result.stdout)




if __name__ == "__main__":
    main()

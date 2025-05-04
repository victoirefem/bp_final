import os
import json
import time
import subprocess
from web3 import Web3

# --- CONFIGURATION ---
RPC_URL = "http://localhost:8545"
CONTRACT_JSON_PATH = "../artifacts/contracts/MpcSession.json"
RUN_PARTY_SCRIPT = "run-party.py"
BANK_INDEX = int(os.environ.get("BANK_INDEX", "-1"))  # Read BANK_INDEX from env

if BANK_INDEX == -1:
    raise Exception("BANK_INDEX environment variable not set! Use 'export BANK_INDEX=0'")

# --- CONNECT TO BLOCKCHAIN ---

with open(CONTRACT_JSON_PATH) as f:
    contract_artifact = json.load(f)
    CONTRACT_ABI = contract_artifact["abi"]
    CONTRACT_ADDRESS = contract_artifact["address"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    raise Exception(f"Failed to connect to blockchain at {RPC_URL}")

print(f"Connected to blockchain at {RPC_URL}")
print(f"Using contract at {CONTRACT_ADDRESS}")

provider = w3
bank_address = provider.eth.accounts[BANK_INDEX].lower()

print(f"Listening as Bank Address: {bank_address}")

mpc_session = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# --- EVENT HANDLING ---

def handle_session_created(event):
    session_id = event['args']['sessionId']
    client_id = event['args']['clientId']
    print(f"[SessionCreated] New Session {session_id} for Client ID: {client_id}")
    print("=> Decide if you want to joinSession!")

def handle_session_started(event):
    session_id = event['args']['sessionId']
    print(f"[SessionStarted] Session {session_id} started.")

    # Fetch joined banks
    joined_banks = mpc_session.functions.getSessionParticipants(session_id).call()
    joined_banks = [addr.lower() for addr in joined_banks]

    if bank_address in joined_banks:
        party_id = joined_banks.index(bank_address)
        print(f"=> This bank joined the session! Running run-party.py with party_id={party_id}")

        subprocess.Popen(
            ["python3", RUN_PARTY_SCRIPT, str(party_id)],
            cwd="../../",  # Path to your run-party.py
        )
    else:
        print(f"=> This bank did NOT join this session. Doing nothing.")

def log_loop(created_filter, started_filter, poll_interval):
    while True:
        for event in created_filter.get_new_entries():
            handle_session_created(event)
        for event in started_filter.get_new_entries():
            handle_session_started(event)
        time.sleep(poll_interval)

# --- CREATE EVENT FILTERS ---

created_filter = mpc_session.events.SessionCreated.create_filter(from_block="latest")
started_filter = mpc_session.events.SessionStarted.create_filter(from_block="latest")

print("Listening for SessionCreated and SessionStarted events...")

# --- START LOOP ---
try:
    log_loop(created_filter, started_filter, 2)
except KeyboardInterrupt:
    print("\nListener stopped manually.")

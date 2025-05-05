import sys
import os
import json

# === Validate input ===
if len(sys.argv) != 3:
    print("Usage: python generate-circuit.py <bankId> <clientId>")
    sys.exit(1)

bank_id = sys.argv[1]
client_id = sys.argv[2]

# === Read input JSON and count transactions ===
input_file = os.path.join("backend", "pdata", "incomes", f"{bank_id}.json")

if not os.path.exists(input_file):
    print(f"Input file not found: {input_file}")
    sys.exit(1)

with open(input_file, "r") as f:
    tx_data = json.load(f)

tx_count = len(tx_data)

if tx_count == 0:
    print(f"No transactions found in {input_file}")
    sys.exit(1)

# === Output circuit path ===
output_dir = os.path.join("backend", "zk", "circuits", "circom")
output_file = os.path.join(output_dir, f"txcheck_{bank_id}.circom")

# === Circuit code with dynamic tx_count ===
circuit_code = f"""\
pragma circom 2.1.0;

include "./templates/poseidon.circom";

template TxCheck(n) {{
    signal input txCommitments[n];
    signal input pdata[n][7];

    component hashes[n];
    for (var i = 0; i < n; i++) {{
        hashes[i] = Poseidon(7);
        for (var j = 0; j < 7; j++) {{
            hashes[i].inputs[j] <== pdata[i][j];
        }}
        hashes[i].out === txCommitments[i];
    }}
}}

component main {{ public [txCommitments] }} = TxCheck({tx_count});
"""

# === Write circuit file ===
os.makedirs(output_dir, exist_ok=True)

with open(output_file, "w") as f:
    f.write(circuit_code)

print(f"Generated circuit: {output_file} (tx_count = {tx_count})")

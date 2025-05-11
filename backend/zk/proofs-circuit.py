import os
import json

# === Hardcoded parameters ===
bank_id = "20"
mode = "i"

# === Fixed paths ===
input_file = os.path.join("backend", "pdata", "proofs", f"{bank_id}.json")
output_dir = os.path.join("backend", "zk", "zk-circuits", "circom", "proofs", bank_id)
output_file = os.path.join(output_dir, "txcheck.circom")

# === Load JSON and count records ===
if not os.path.exists(input_file):
    print(f"Input file not found: {input_file}")
    exit(1)

with open(input_file, "r") as f:
    data = json.load(f)

count = len(data)
if count == 0:
    print(f"No records found in {input_file}")
    exit(1)

# === Circuit template ===
circuit_code = f"""\
pragma circom 2.1.0;

include "../../templates/poseidon.circom";

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

component main {{ public [txCommitments] }} = TxCheck({count});
"""

# === Write circuit ===
os.makedirs(output_dir, exist_ok=True)
with open(output_file, "w") as f:
    f.write(circuit_code)

print(f"Generated circuit for {count} income records at: {output_file}")

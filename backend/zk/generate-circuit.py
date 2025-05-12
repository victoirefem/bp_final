import sys
import os
import json


if len(sys.argv) != 3:
    print("Usage: python generate-circuit.py <bankId> <i|r>")
    sys.exit(1)

bank_id = sys.argv[1]
mode = sys.argv[2].lower()

if mode not in ["i", "r"]:
    print("Invalid mode. Use 'i' for income or 'r' for risk.")
    sys.exit(1)

# Paths & filenames
is_income = mode == "i"
input_file = os.path.join("backend", "pdata", "incomes" if is_income else "risks", f"{bank_id}.json")
output_dir = os.path.join("backend", "zk", "zk-circuits", "circom", bank_id)
output_file = os.path.join(output_dir, f"{'txcheck' if is_income else 'riskcheck'}.circom")

# Load JSON and count records
if not os.path.exists(input_file):
    print(f"Input file not found: {input_file}")
    sys.exit(1)

with open(input_file, "r") as f:
    data = json.load(f)

count = len(data)
if count == 0:
    print(f"No records found in {input_file}")
    sys.exit(1)

# Circuit code for income or risk 
if is_income:
    circuit_code = f"""\
pragma circom 2.1.0;

include "../templates/poseidon.circom";

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
else:
    circuit_code = f"""\
pragma circom 2.1.0;

include "../templates/poseidon.circom";

template RiskCheck(n) {{
    signal input riskCommitments[n];
    signal input pdata[n][2];

    component hashes[n];
    for (var i = 0; i < n; i++) {{
        hashes[i] = Poseidon(2);
        hashes[i].inputs[0] <== pdata[i][0];
        hashes[i].inputs[1] <== pdata[i][1];
        hashes[i].out === riskCommitments[i];
    }}
}}

component main {{ public [riskCommitments] }} = RiskCheck({count});
"""

#  Write circuit to file 
os.makedirs(output_dir, exist_ok=True)
with open(output_file, "w") as f:
    f.write(circuit_code)

# print(f"Generated circuit: {output_file} ({'tx' if is_income else 'risk'}_count = {count})")

import json
import os
import sys

# === Get arguments from CLI ===
if len(sys.argv) != 4:
    print("Usage: python backend/mpc/generate-mpc-settings.py <init_bank_id> <invited_bank_ids_csv> <inputs_csv>")
    sys.exit(1)

init_bank_id = sys.argv[1]
invited_bank_ids = sys.argv[2].split(",")
invited_inputs = list(map(int, sys.argv[3].split(",")))

inputs_per_party = [sum(invited_inputs) + 1] + invited_inputs
N = len(inputs_per_party)

# === Validate
if inputs_per_party[0] != sum(inputs_per_party[1:]) + 1:
    print("Invalid input counts: init bank must provide sum of all others + 1")
    sys.exit(1)

# === Output files
output_dir = os.path.join(os.path.dirname(__file__), "mpc-config")
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, "mpc_settings.json")

# === Construct MPC settings structure
settings = []
ri_counter = 0

for i in range(N):
    party_entry = {
        "name": f"p{i}",
        "inputs": [],
        "outputs": ["0.fin"]
    }

    if i == 0:  # Init bank
        for j in range(inputs_per_party[i]):
            if j == 0:
                party_entry["inputs"].append("0.t")
            else:
                party_entry["inputs"].append(f"0.ai[{j-1}]")
    else:  # Invited banks
        for j in range(inputs_per_party[i]):
            party_entry["inputs"].append(f"0.ri[{ri_counter}]")
            ri_counter += 1

    settings.append(party_entry)

# === Write the file
with open(output_file, "w") as f:
    json.dump(settings, f, indent=4)

print(f"Generated mpc_settings.json for {N} parties in {output_file}")

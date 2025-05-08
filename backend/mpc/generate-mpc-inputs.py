import os
import sys
import json

if len(sys.argv) != 4:
    print("Usage: python backend/mpc/generate-mpc-inputs.py <init_bank_id> <invited_ids_csv> <inputs_csv>")
    sys.exit(1)

init_bank_id = sys.argv[1]
invited_bank_ids = sys.argv[2].split(",")
inputs_per_bank = list(map(int, sys.argv[3].split(",")))

settings_path = os.path.join("backend", "mpc", "mpc-config", "mpc_settings.json")
output_dir = os.path.join("backend", "mpc", "mpc-inputs")
os.makedirs(output_dir, exist_ok=True)

with open(settings_path) as f:
    settings = json.load(f)

# === Load income data for p0
income_path = os.path.join("backend", "pdata", "incomes", f"{init_bank_id}.json")
if not os.path.exists(income_path):
    print(f"❌ Income data not found: {income_path}")
    sys.exit(1)

with open(income_path) as f:
    income_data = json.load(f)

converted_values = []
bank_to_values = {bank_id: [] for bank_id in invited_bank_ids}
total_usd = 0

for tx in income_data:
    usd = float(tx["Converted USD"])
    from_bank = tx["From Bank"]
    total_usd += usd
    if from_bank in bank_to_values:
        bank_to_values[from_bank].append(usd)

# Flatten and order ai values by invited bank order
ai_values = []
for bank_id in invited_bank_ids:
    sorted_usds = sorted(bank_to_values[bank_id])  # optional sort
    ai_values.extend(sorted_usds)

t_value = round(total_usd)

# === Generate p0 input file
p0 = next((party for party in settings if party["name"] == "p0"), None)
if not p0:
    print("❌ No p0 found in mpc_settings.json")
    sys.exit(1)

p0_inputs = {}
ai_index = 0
for key in p0["inputs"]:
    if key == "0.t":
        p0_inputs[key] = int(round(t_value))
    elif key.startswith("0.ai["):
        if ai_index >= len(ai_values):
            print(f"⚠ Not enough ai values for key {key}")
            p0_inputs[key] = 0
        else:
            p0_inputs[key] = int(round(ai_values[ai_index]))
            ai_index += 1
    else:
        p0_inputs[key] = 0

p0_path = os.path.join(output_dir, "inputs_party_0.json")
with open(p0_path, "w") as f:
    json.dump(p0_inputs, f, indent=2)
print(f"✅ inputs_party_0.json written with {ai_index} ai[] values")

# === Now handle each invited party (p1, p2, ...)
for i, party in enumerate(settings):
    if party["name"] == "p0":
        continue  # already handled

    bank_index = i - 1
    if bank_index >= len(invited_bank_ids):
        print(f"❌ Unexpected: no bank ID for party {party['name']}")
        continue

    bank_id = invited_bank_ids[bank_index]
    risk_path = os.path.join("backend", "pdata", "risks", f"{bank_id}.json")
    if not os.path.exists(risk_path):
        print(f"⚠ No risk file for bank {bank_id}, skipping...")
        continue

    with open(risk_path) as f:
        risks = json.load(f)

    ri_index = 0
    inputs_dict = {}

    for key in party["inputs"]:
        if ri_index >= len(risks):
            print(f"⚠ Not enough risk entries in {risk_path} for {key}")
            inputs_dict[key] = 0
        else:
            score_str = risks[ri_index].get("Risk Score", "0")
            try:
                scaled = int(round(float(score_str) * 1_000_000))
            except ValueError:
                scaled = 0
            inputs_dict[key] = scaled
            ri_index += 1

    party_out = os.path.join(output_dir, f"inputs_party_{i}.json")
    with open(party_out, "w") as f:
        json.dump(inputs_dict, f, indent=2)

    print(f"✅ {party_out} written with {ri_index} ri[] values")

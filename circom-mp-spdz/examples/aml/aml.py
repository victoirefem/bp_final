import random
import json
import argparse

# === Parse arguments ===
parser = argparse.ArgumentParser()
parser.add_argument("--bw", type=int, required=True, help="Bayes weight (scaled int)")
parser.add_argument("--pml", type=int, required=True, help="P(ML) (scaled int)")
args = parser.parse_args()

bw_value = args.bw
pml_value = args.pml

# === Configuration ===
M = 3  # 3 banks
inlisttxt = "0.inlist"
outtxt = "0.fin"

# === Build settings and inputs ===
mpc_settings = []
inputs_for_all_parties = []

for i in range(M):
    inputs = [f"{inlisttxt}[{i}]"]
    if i == 0:
        inputs += ["0.bw", "0.pml"]  # only party 0 supplies these

    mpc_settings.append({
        "name": f"p{i}",
        "inputs": inputs,
        "outputs": [outtxt]
    })

    # All parties get the values in their input JSONs
    party_inputs = {
        f"{inlisttxt}[{i}]": random.randint(0, 150),
        "0.bw": bw_value,
        "0.pml": pml_value
    }

    inputs_for_all_parties.append(party_inputs)


# === Write output files ===
with open("mpc_settings_aml.json", "w") as f:
    json.dump(mpc_settings, f, indent=2)

for i in range(M):
    with open(f"inputs_party_{i}.json", "w") as f:
        json.dump(inputs_for_all_parties[i], f, indent=2)

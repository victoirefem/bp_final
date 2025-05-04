import json
import os

# Party input definitions

inputs_per_party = [5, 2, 1, 1]  # Bank B (3 weights + 1 t), Bank A (2 risks), Bank C (1 risk)
N = len(inputs_per_party)  # Number of parties

# File paths
inlisttxt = "0.inlist"
outtxt = "0.fin"

list = []  # For mpc_settings.json
inlistdictlist = []  # For inputs_party_*.json

# Counters
ri_counter = 0  # counter for ri indexing

for i in range(N):
    inlistdict = {}
    party_inputs = []

    list.append({"name": f"p{i}", "inputs": [], "outputs": [outtxt]})
    
    # First party (Bank B) provides weights
    if i == 0:
        for j in range(inputs_per_party[i]):
            if j == 0:
                input_name = f"0.t"
                list[i]['inputs'].append(input_name)
            else:
                input_name = f"0.ai[{j-1}]"
                list[i]['inputs'].append(input_name)
    else:
        for j in range(inputs_per_party[i]):
            input_name = f"0.ri[{ri_counter}]"
            list[i]['inputs'].append(input_name)
            ri_counter += 1


# Save mpc_settings_comp.json

# Ensure the "mpc-config" directory exists
output_dir = os.path.join(os.path.dirname(__file__), "mpc-config")
os.makedirs(output_dir, exist_ok=True)

# Save mpc_settings.json in the "mpc-config" directory
output_file = os.path.join(output_dir, 'mpc_settings.json')
with open(output_file, 'w') as fp:
    json.dump(list, fp, indent=4)

# Optionally save inputs_party files (not requested now, kept here for context)
# for i in range(M):
#     with open(f"inputs_party_{i}.json", 'w') as fp:
#         json.dump(inlistdictlist[i], fp)

print(f"Generated mpc_settings_risk.json for {N} parties")

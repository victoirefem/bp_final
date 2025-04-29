import json

# Party input definitions

inputs_per_party = [3, 2, 1]  # Bank B (3 weights), Bank A (2 risks), Bank C (1 risk)
N = len(inputs_per_party)  # Number of parties

# File paths
inlisttxt = "0.inlist"
out1txt = "0.r_new"

list = []  # For mpc_settings.json
inlistdictlist = []  # For inputs_party_*.json

# Counters
ri_counter = 0  # counter for ri indexing

for i in range(N):
    inlistdict = {}
    party_inputs = []

    list.append({"name": f"p{i}", "inputs": [], "outputs": [out1txt]})
    
    # First party (Bank B) provides weights
    if i == 0:
        for j in range(inputs_per_party[i]):
            input_name = f"0.w[{j}]"
            list[i]['inputs'].append(input_name)
            inlistdict[input_name] = 1
    else:
        for j in range(inputs_per_party[i]):
            input_name = f"0.ri[{ri_counter}]"
            list[i]['inputs'].append(input_name)
            inlistdict[input_name] = 1
            ri_counter += 1

    inlistdictlist.append(inlistdict)

# Save mpc_settings_comp.json
with open('mpc_settings_risk.json', 'w') as fp:
    json.dump(list, fp, indent=4)

# Optionally save inputs_party files (not requested now, kept here for context)
# for i in range(M):
#     with open(f"inputs_party_{i}.json", 'w') as fp:
#         json.dump(inlistdictlist[i], fp)

# print(f"Generated mpc_settings_comp.json for {M} parties.")

import os
import json
import re
import math
from collections import defaultdict

# Path to the inputs folder (relative to the current folder)
inputs_folder = os.path.join(os.getcwd(), "circom-mp-spdz", "examples", "aml")

# Pattern to match input files
file_pattern = re.compile(r"inputs_party_(\d+)\.json")

# Storage for values by variable index
values_by_variable = defaultdict(list)

# Iterate through all input files
for filename in os.listdir(inputs_folder):
    if file_pattern.match(filename):
        file_path = os.path.join(inputs_folder, filename)
        with open(file_path, 'r') as f:
            data = json.load(f)
            for key, value in data.items():
                # Extract the second index from the key (e.g., [0][12] → 12)
                match = re.search(r"\[.*?\]\[(\d+)\]", key)
                if match:
                    var_index = int(match.group(1))
                    values_by_variable[var_index].append(value)

# Calculate averages and assign to a_1, a_2, ..., a_n
averages = {}
for i in sorted(values_by_variable.keys()):
    avg = sum(values_by_variable[i]) / len(values_by_variable[i])
    averages[f'a_{i + 1}'] = avg

# standard eviation for account tenure

fifth_values = values_by_variable[4]
mean_5 = sum(fifth_values) / len(fifth_values)
variance_5 = sum((x - mean_5) ** 2 for x in fifth_values) / (len(fifth_values) - 1)
a_5sd = math.sqrt(variance_5)


# Print results
output_file = os.path.join(os.getcwd(), "comp-verify-r.txt")

with open(output_file, 'w') as f:
    for var, avg in averages.items():
        f.write(f"{var} <- {avg}\n")
    f.write(f"a_5sd = {a_5sd}\n")

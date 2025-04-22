import os
import json
import re
import sys

# --- Step 1: Parse arguments ---
if len(sys.argv) != 3:
    print("Usage: python calculate_gamma.py <bw> <pml>")
    sys.exit(1)

bw = float(sys.argv[1])
pml = float(sys.argv[2])

# --- Step 2: Setup ---
inputs_folder = os.path.join(os.getcwd(), "circom-mp-spdz", "examples", "aml")
file_pattern = re.compile(r"inputs_party_(\d+)\.json")

values = []

# --- Step 3: Read relevant values ---
for filename in os.listdir(inputs_folder):
    match = file_pattern.match(filename)
    if match:
        i = int(match.group(1))
        file_path = os.path.join(inputs_folder, filename)
        with open(file_path, 'r') as f:
            data = json.load(f)
            key = f"0.inlist[{i}]"  # You can change the [0] if needed
            if key in data:
                values.append(data[key])
            else:
                print(f"Key {key} not found in {filename}")

# --- Step 4: Compute gamma and formula ---
if not values:
    print("No valid values found.")
    sys.exit(1)

gamma = sum(values) / (len(values) * 1000)
result = (1 - bw) * pml / gamma

# --- Step 5: Print results ---
print("=====================")
print("AML VERIFY")
print(f"gamma = {gamma}")
print(f"result = {result}")

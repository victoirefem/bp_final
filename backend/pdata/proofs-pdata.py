import csv
import json
import os
import sys

# === Hardcoded parameters ===
bank_id = "20"
data_type = "i"

# === Accept `n` from CLI arguments ===
if len(sys.argv) != 2:
    print("Usage: python backend/pdata/proofs-pdata.py <num_rows>")
    sys.exit(1)

try:
    n = int(sys.argv[1])
    if n <= 0:
        raise ValueError
except ValueError:
    print("Invalid input: expected a positive integer.")
    sys.exit(1)

input_file = os.path.join("bank_data", "raw", f"{bank_id}_income.csv")
output_file = os.path.join("backend", "pdata", "proofs", f"{bank_id}.json")

# === Read and filter the first n rows ===
filtered_rows = []

try:
    with open(input_file, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for i, row in enumerate(reader):
            if i >= n:
                break
            pdata_entry = {
                "Timestamp": row["Timestamp"],
                "From Bank": row["From Bank"],
                "From Account": row["From Account"],
                "To Account": row["To Account"],
                "Amount Received": row["Amount Received"],
                "Receiving Currency": row["Receiving Currency"],
                "Converted USD": row["Converted USD"]
            }
            filtered_rows.append(pdata_entry)
except FileNotFoundError:
    print(f"Input file not found: {input_file}")
    sys.exit(1)

# === Write filtered output ===
os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(output_file, "w") as f:
    json.dump(filtered_rows, f, indent=2)

print(f"Saved {len(filtered_rows)} income entries to {output_file}")

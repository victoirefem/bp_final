import csv
import json
import os
import sys

# === Input validation ===
if len(sys.argv) != 3:
    print("Usage: python backend/pdata/generate-pdata.py <bankId> <clientId>")
    sys.exit(1)

bank_id = sys.argv[1]
client_id = sys.argv[2]

# === Paths ===
input_file = os.path.join("bank_data", "raw", f"{bank_id}_income.csv")
output_dir = os.path.join("backend", "pdata", "incomes")
output_file = os.path.join(output_dir, f"{bank_id}.json")

# === Read and filter ===
filtered_rows = []

try:
    with open(input_file, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if row["To Account"] == client_id and row["From Bank"] != bank_id:
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

# === Ensure output folder exists and write ===
os.makedirs(output_dir, exist_ok=True)

with open(output_file, "w") as f:
    json.dump(filtered_rows, f, indent=2)

print(f"Saved {len(filtered_rows)} filtered transactions to {output_file}")

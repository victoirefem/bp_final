import csv
import json
import os
import sys

# === Input validation ===
if len(sys.argv) != 4:
    print("Usage: python backend/pdata/generate-pdata.py <bankId> <clientId> <type: i|r>")
    sys.exit(1)

bank_id = sys.argv[1]
client_id = sys.argv[2]
data_type = sys.argv[3].lower()

if data_type not in ["i", "r"]:
    print("Invalid type. Use 'i' for income or 'r' for risk.")
    sys.exit(1)

# === Determine input/output paths ===
if data_type == "i":
    input_file = os.path.join("bank_data", "raw", f"{bank_id}_income.csv")
    output_dir = os.path.join("backend", "pdata", "incomes")
    output_file = os.path.join(output_dir, f"{bank_id}.json")
else:  # data_type == "r"
    input_file = os.path.join("bank_data", "raw", f"{bank_id}_risks.csv")
    output_dir = os.path.join("backend", "pdata", "risks")
    output_file = os.path.join(output_dir, f"{bank_id}.json")

# === Filtering logic ===
filtered_rows = []

try:
    with open(input_file, newline="") as csvfile:
        reader = csv.DictReader(csvfile)

        if data_type == "i":
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
        else:  # risk
            for row in reader:
                if row["Account"] == client_id:
                    pdata_entry = {
                        "Account": row["Account"],
                        "Risk Score": row["Risk Score"]
                    }
                    filtered_rows.append(pdata_entry)

except FileNotFoundError:
    print(f"Input file not found: {input_file}")
    sys.exit(1)

# === Write filtered output ===
os.makedirs(output_dir, exist_ok=True)

with open(output_file, "w") as f:
    json.dump(filtered_rows, f, indent=2)

# print(f"Saved {len(filtered_rows)} filtered {'income' if data_type == 'i' else 'risk'} entries to {output_file}")

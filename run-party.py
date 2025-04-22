import json
import sys
import os
import subprocess
import re
from pathlib import Path

# === CONFIGURATION ===
PROJECT_ROOT = Path(__file__).parent
MPSPDZ_PROJECT_ROOT = PROJECT_ROOT / 'MP-SPDZ'
BANK_DATA_ROOT = PROJECT_ROOT / 'client-ledger' / 'data'
COMP_CIRCUIT_NAME = "comp"
HOSTS_FILE = "HOSTS"

COMP_CIRCUIT_INFO_DIR = PROJECT_ROOT / 'circom-mp-spdz' / 'outputs' / 'comp' / 'circuit_info.json'
COMP_MPC_SETTINGS_DIR = PROJECT_ROOT / 'circom-mp-spdz' / 'examples' / 'aml' / 'mpc_settings_comp.json'

SSN = "1488"
MONTH = 202504

# === CIRCOM-MP-SPDZ ===
def generate_mpspdz_inputs_for_party(
    party: int,
    input_json_for_party_path: Path,
    circuit_info_path: Path,
    mpc_settings_path: Path,
):
    '''
    Generate MP-SPDZ circuit inputs for a party, including support for public inputs.
    '''

    with open(input_json_for_party_path) as f:
        all_input_values_for_party_json = json.load(f)

    raw_input_values_for_party_json = all_input_values_for_party_json["pdata"]

    input_values_for_party_json = {
        f"0.inlist[{party}][{i}]": int(value)
        for i, value in enumerate(raw_input_values_for_party_json)
    }

    with open(mpc_settings_path, 'r') as f:
        mpc_settings = json.load(f)

    inputs_from: dict[str, int] = {}
    for party_index, party_settings in enumerate(mpc_settings):
        for input_name in party_settings['inputs']:
            inputs_from[input_name] = int(party_index)

    with open(circuit_info_path, 'r') as f:
        circuit_info = json.load(f)
        input_name_to_wire_index = circuit_info['input_name_to_wire_index']


    wire_to_name_sorted = sorted(input_name_to_wire_index.items(), key=lambda x: x[1])
    wire_value_in_order_for_mpsdz = []
    for wire_name, wire_index in wire_to_name_sorted:
        wire_from_party = int(inputs_from[wire_name])
        # For the current party, we only care about the inputs from itself
        if wire_from_party == party:
            wire_value = input_values_for_party_json[wire_name]
            wire_value_in_order_for_mpsdz.append(wire_value)

    # print(f"[P{party}] Inputs: ", list(zip([w for w, _ in wire_to_name_sorted], wire_value_in_order_for_mpsdz)))

    # Save inputs for this party
    input_file_for_party_mpspdz = MPSPDZ_PROJECT_ROOT / "Player-Data" / f"Input-P{party}-0"
    with open(input_file_for_party_mpspdz, 'w') as f:
        f.write(" ".join(map(str, wire_value_in_order_for_mpsdz)))

    return input_file_for_party_mpspdz



# === HELPERS ===

def write_input_file(party_id):

    input_json_for_party_path = Path(f"{BANK_DATA_ROOT}/bank{party_id}/pdata/{SSN}_{MONTH}.json")
    if not input_json_for_party_path.exists():
        print(f"❌ pdata file missing for party {party_id}: {path}")
        sys.exit(1)

    generate_mpspdz_inputs_for_party(
        party_id,
        input_json_for_party_path,
        COMP_CIRCUIT_INFO_DIR,
        COMP_MPC_SETTINGS_DIR
    )


def compile_circuit(circuit):
    print(f"🛠️ Compiling {circuit}.mpc ...")
    try:
        result = subprocess.run(
            ["./compile.py", circuit],
            cwd=MPSPDZ_PROJECT_ROOT,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ Compilation of '{circuit}' successful.")
        print(result.stdout)

    except subprocess.CalledProcessError as e:
        print(f"Compilation of '{circuit}' failed!")
        print(f"Return Code: {e.returncode}")
        print(f"STDERR:\n{e.stderr}")
        print(f"STDOUT:\n{e.stdout}")
        sys.exit(1)



def run_mpc(circuit_name, party_id):
    cmd = [
        "./semi-party.x",
        "-N", "3",
        "-p", str(party_id),
        "-OF", ".",
        circuit_name,
        "-ip", HOSTS_FILE
    ]

    print(f"🚀 Starting MPC for party {party_id}...")

    try:
        result = subprocess.run(
            cmd,
            cwd=MPSPDZ_PROJECT_ROOT,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ MPC for party {party_id} finished successfully.")
        print(result.stdout)

    except subprocess.CalledProcessError as e:
        print(f"MPC for party {party_id} failed!")
        print(f"Return Code: {e.returncode}")
        print(f"STDERR:\n{e.stderr}")
        print(f"STDOUT:\n{e.stdout}")
        sys.exit(1)

    

def workflow(circuit_name, party_id):
    compile_circuit(circuit_name)
    write_input_file(party_id)
    run_mpc(circuit_name, party_id)



# === MAIN ===
def main():
    if len(sys.argv) < 2:
        print("Usage: python3 run_comp_party.py [party_id]")
        sys.exit(1)

    party_id = int(sys.argv[1])

    workflow(
        circuit_name=COMP_CIRCUIT_NAME,
        party_id=party_id
    )

if __name__ == "__main__":
    main()

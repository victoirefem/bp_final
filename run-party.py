import json
import sys
import os
import subprocess
import re
import math
from pathlib import Path

# === CONFIGURATION ===
PROJECT_ROOT = Path(__file__).parent
MPSPDZ_PROJECT_ROOT = PROJECT_ROOT / 'MP-SPDZ'
BANK_DATA_ROOT = PROJECT_ROOT / 'client-ledger' / 'data'
COMP_CIRCUIT_NAME = "comp"
AML_CIRCUIT_NAME = "aml"
HOSTS_FILE = "HOSTS"

CIRCUIT_INFO_DIR = PROJECT_ROOT / 'circom-mp-spdz' / 'outputs'
MPC_SETTINGS_DIR = PROJECT_ROOT / 'circom-mp-spdz' / 'examples' / 'aml'


SSN = "1488"
MONTH = 202504

P_ML = 5

# === CIRCOM-MP-SPDZ ===
def generate_mpspdz_inputs_for_party(
    party: int,
    input_json_for_party_path: Path,
    circuit_name: str,
    circuit_info_path: Path,
    mpc_settings_path: Path,
    public_inputs: dict = None
):
    '''
    Generate MP-SPDZ circuit inputs for a party, including support for public inputs.
    '''

    with open(input_json_for_party_path) as f:
        all_input_values_for_party_json = json.load(f)

    # raw_input_values_for_party_json = all_input_values_for_party_json["pdata"]

    if circuit_name == "comp":
        raw_input_values_for_party_json = all_input_values_for_party_json["pdata"]
        input_values_for_party_json = {
        f"0.inlist[{party}][{i}]": int(value)
        for i, value in enumerate(raw_input_values_for_party_json)
    }
    elif circuit_name == "aml":
        raw_input_values_for_party_json = all_input_values_for_party_json["prf_pdata"]
        input_values_for_party_json = {
            f"0.inlist[{party}]": int(raw_input_values_for_party_json)
        }
        if party == 0 and public_inputs:
            input_values_for_party_json["0.bw"] = public_inputs["0.bw"]
            input_values_for_party_json["0.pml"] = public_inputs["0.pml"]

    

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

    print(f"Generated input file for party {party} ({circuit_name}): {input_file_for_party_mpspdz}")
    return input_file_for_party_mpspdz



# === HELPERS ===

def write_input_file(party_id, circuit_name, public_inputs):

    input_json_for_party_path = Path(f"{BANK_DATA_ROOT}/bank{party_id}/pdata/{SSN}_{MONTH}.json")
    if not input_json_for_party_path.exists():
        print(f"error: pdata file missing for party {party_id}: {input_json_for_party_path}")
        sys.exit(1)

    # circuit_info_path = CIRCUIT_INFO_DIR / 'comp' / 'circuit_info.json'
    circuit_info_path = Path(f"{CIRCUIT_INFO_DIR}/{circuit_name}/circuit_info.json")
    mpc_settings_path = Path(f"{MPC_SETTINGS_DIR}/mpc_settings_{circuit_name}.json")


    generate_mpspdz_inputs_for_party(
        party_id,
        input_json_for_party_path,
        circuit_name,
        circuit_info_path,
        mpc_settings_path,
        public_inputs
    )


def compile_circuit(circuit):
    print()
    print(f"Compiling {circuit}.mpc ...")
    print()
    try:
        result = subprocess.run(
            ["./compile.py", circuit],
            cwd=MPSPDZ_PROJECT_ROOT,
            check=True,
            capture_output=True,
            text=True
        )
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

    print(f"Starting MPC for party {party_id}...")

    try:
        result = subprocess.run(
            cmd,
            cwd=MPSPDZ_PROJECT_ROOT,
            check=True,
            capture_output=True,
            text=True
        )
        stdout = result.stdout
        print(f"MPC for party {party_id} finished successfully")
        print(stdout)

        # === SAVE OUTPUTS ===
        output_dir = MPSPDZ_PROJECT_ROOT / "mpc-results"
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / f"party{party_id}_{circuit_name}_result.json"

        # === PARSE OUTPUT ===
    
        beta_match = re.search(r'outputs\[\d+\]: 0\.beta=([0-9.]+)', stdout)
        sum_no_sd_match = re.search(r'outputs\[\d+\]: 0\.sum_no_sd=([0-9.]+)', stdout)
        fin_match = re.search(r'outputs\[\d+\]: 0\.fin=([0-9.]+)', stdout)

        if beta_match and sum_no_sd_match:
            beta = float(beta_match.group(1))
            sum_no_sd = float(sum_no_sd_match.group(1))
            std_dev = 7*math.sqrt(sum_no_sd)/3600
            bw = int(1000*(sum_no_sd + std_dev) / 8)

            print(f"Parsed outputs for P{party_id}:")
            print(f"  • Beta:        {beta}")
            print(f"  • Sum no SD:   {sum_no_sd}")
            print(f"  • Std Dev:     {std_dev:.5f}")
            print(f"  • BW:   {bw:.5f}")
            print()

            with open(output_path, "w") as f:
                json.dump({
                    "beta": beta,
                    "sum_no_sd": sum_no_sd,
                    "std_dev": std_dev,
                    "bw": bw
                }, f, indent=2)

            print(f"Saved results to {output_path}")
            return bw
        
        elif fin_match:
            fin = float(fin_match.group(1))
            print(f"Parsed Outputs for P{party_id}:")
            print(f"  • Fin: {fin}")
            print()

            with open(output_path, "w") as f:
                json.dump({
                    "fin": fin
                }, f, indent=2)

            print(f"Saved results to {output_path}")
            return fin

        else:
            print("error: Couldnt find expected output values in stdout")
            return None

    except subprocess.CalledProcessError as e:
        print(f"MPC for party {party_id} failed!")
        print(f"Return Code: {e.returncode}")
        print(f"STDERR:\n{e.stderr}")
        print(f"STDOUT:\n{e.stdout}")
        sys.exit(1)


    

def workflow(circuit_name, party_id, public_inputs: dict = None):
    compile_circuit(circuit_name)
    write_input_file(party_id, circuit_name, public_inputs)
    return run_mpc(circuit_name, party_id)



# === MAIN ===
def main():
    if len(sys.argv) < 2:
        print("Usage: python3 run_comp_party.py [party_id]")
        sys.exit(1)

    party_id = int(sys.argv[1])

    bw = workflow(
        circuit_name=COMP_CIRCUIT_NAME,
        party_id=party_id
    )

    # print("Final BW used for AML circuit:", bw)


    aml =workflow(
        circuit_name=AML_CIRCUIT_NAME,
        party_id=party_id, 
        public_inputs={
            "0.bw": bw,
            "0.pml": P_ML
        }
    )

if __name__ == "__main__":
    main()

import json
import sys
import os
import subprocess
import re
import math
from pathlib import Path
from dataclasses import dataclass
from enum import Enum

class AGateType(Enum):
    ADD = 'AAdd'
    DIV = 'ADiv'
    EQ = 'AEq'
    GT = 'AGt'
    GEQ = 'AGEq'
    LT = 'ALt'
    LEQ = 'ALEq'
    MUL = 'AMul'
    NEQ = 'ANeq'
    SUB = 'ASub'
    BW_XOR = 'AXor'
    POW = 'APow'
    IDIV = 'AIntDiv'
    MOD = 'AMod'
    BW_SHL = 'AShiftL'
    BW_SHR = 'AShiftR'
    BW_OR = 'ABoolOr'
    BW_AND = 'ABoolAnd'
    # ABitOr,
    # ABitAnd,


MAP_GATE_TYPE_TO_OPERATOR_STR = {
    AGateType.ADD: '+',
    AGateType.MUL: '*',
    AGateType.DIV: '/',
    AGateType.LT: '<',
    AGateType.SUB: '-',
    AGateType.EQ: '==',
    AGateType.NEQ: '!=',
    AGateType.GT: '>',
    AGateType.GEQ: '>=',
    AGateType.LEQ: '<=',
    AGateType.BW_XOR: "^",
    AGateType.POW: "**",
    AGateType.IDIV: "/",
    AGateType.MOD: "%",
    AGateType.BW_SHL: "<<",
    AGateType.BW_SHR: ">>",
    AGateType.BW_OR: "|",
    AGateType.BW_AND:"&"
}


# === CONFIGURATION ===
PROJECT_ROOT = Path(__file__).parent.parent.parent
BACKEND_ROOT = PROJECT_ROOT / 'backend'
MPSPDZ_PROJECT_ROOT = PROJECT_ROOT / 'MP-SPDZ'
MPSPDZ_CIRCUIT_DIR = MPSPDZ_PROJECT_ROOT / 'Programs' / 'Source'
CIRCOM_2_ARITHC_PROJECT_ROOT = PROJECT_ROOT / 'circom-2-arithc'

MPC_CONFIG_DIR = BACKEND_ROOT / 'mpc' / 'mpc-config'
MPC_CIRCUITS_DIR = BACKEND_ROOT / 'mpc' / 'mpc-circuits'
MPC_INPUTS_DIR = BACKEND_ROOT / 'mpc' / 'mpc-inputs'

RISK_CIRCUIT_NAME = "risk"
HOSTS_FILE = "HOSTS"



# === CIRCOM-MP-SPDZ ===

def generate_mpspdz_inputs_for_party(
    party: int,
    input_json_for_party_path: Path,
    circuit_name: str,
    circuit_info_path: Path,
    mpc_settings_path: Path
):
    '''
    Generate MP-SPDZ circuit inputs for a party, including support for public inputs.
    '''

    with open(input_json_for_party_path) as f:
        input_values_for_party_json = json.load(f)

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


def generate_mpspdz_circuit(
    arith_circuit_path: Path,
    circuit_info_path: Path,
    mpc_settings_path: Path,
    circuit_name: str = 'circuit',
) -> Path:
    '''
    Generate the MP-SPDZ circuit code that can be run by MP-SPDZ.

    Steps:
    1. Read the arithmetic circuit file to get the gates
    2. Read the circuit info file to get the input/output wire mapping
    3. Read the input config file to get which party inputs should be read from
    4. Generate the MP-SPDZ from the inputs above. The code should:
        4.1. Initialize a `wires` list with input wires filled in: if a wire is a constant, fill it in directly. if a wire is an input, fill in which party this input comes from
        4.2. Translate the gates into corresponding operations in MP-SPDZ
        4.3. Print the outputs
    '''
   
    with open(circuit_info_path, 'r') as f:
        raw = json.load(f)

    input_name_to_wire_index = {k: int(v) for k, v in raw['input_name_to_wire_index'].items()}
    constants: dict[str, dict[str, int]] = raw['constants']
    output_name_to_wire_index = {k: int(v) for k, v in raw['output_name_to_wire_index'].items()}
    
    with open(mpc_settings_path, 'r') as f:
        mpc_settings = json.load(f)

    # Each gate line looks like this: '2 1 1 0 3 AAdd'
    @dataclass(frozen=True)
    class Gate:
        num_inputs: int
        num_outputs: int
        gate_type: AGateType
        inputs_wires: list[int]
        output_wire: int
    with open(arith_circuit_path, 'r') as f:
        first_line = next(f)
        num_gates, num_wires = map(int, first_line.split())
        second_line = next(f)
        num_inputs = int(second_line.split()[0])
        third_line = next(f)
        num_outputs = int(third_line.split()[0])
        # Skip the next line
        next(f)

        # Read the gate lines
        gates: list[Gate] = []
        for line in f:
            line = line.split()
            num_inputs = int(line[0])
            num_outputs = int(line[1])
            inputs_wires = [int(x) for x in line[2:2+num_inputs]]
            # Support 2 inputs only for now
            assert num_inputs == 2 and num_inputs == len(inputs_wires)
            output_wires = list(map(int, line[2+num_inputs:2+num_inputs+num_outputs]))
            output_wire = output_wires[0]
            # Support 1 output only for now
            assert num_outputs == 1 and num_outputs == len(output_wires)
            gate_type = AGateType(line[2+num_inputs+num_outputs])
            gates.append(Gate(num_inputs, num_outputs, gate_type, inputs_wires, output_wire))
    assert len(gates) == num_gates

    # Make inputs to circuit (not wires!!) from the user config
    # Initialize a list `inputs` with `num_wires` with value=None
    inputs_str_list = [None] * num_wires
    print_outputs_str_list = []
    # Fill in the constants
    for name, o in constants.items():
        value = int(o['value'])
        # descaled_value = value / (10 ** scale)
        wire_index = int(o['wire_index'])
        # Sanity check
        if inputs_str_list[wire_index] is not None:
            raise ValueError(f"Wire index {wire_index} is already filled in: {inputs_str_list[wire_index]=}")
        # Should check if we should use cfix instead
        inputs_str_list[wire_index] = f'cint({value})'
    for party_index, party_settings in enumerate(mpc_settings):
        # Fill in the inputs from the parties
        for input_name in party_settings['inputs']:
            wire_index = int(input_name_to_wire_index[input_name])
            # Sanity check
            if inputs_str_list[wire_index] is not None:
                raise ValueError(f"Wire index {wire_index} is already filled in: {inputs_str_list[wire_index]=}")
            # Should check if we should use sfix instead
            inputs_str_list[wire_index] = f'sint.get_input_from({party_index})'
        # Fill in the outputs
        for output_name in party_settings['outputs']:
            wire_index = int(output_name_to_wire_index[output_name])
            print_outputs_str_list.append(
                f"print_ln_to({party_index}, 'outputs[{len(print_outputs_str_list)}]: {output_name}=%s', wires[{wire_index}].reveal_to({party_index}))"
            )


    # Replace all `None` with str `'None'`
    inputs_str_list = [x if x is not None else 'None' for x in inputs_str_list]

    #
    # Generate the circuit code
    #
    inputs_str = '[' + ', '.join(inputs_str_list) + ']'

    # Translate bristol gates to MP-SPDZ operations
    gates_str_list = []
    for gate in gates:
        gate_str = ''
        if gate.gate_type not in MAP_GATE_TYPE_TO_OPERATOR_STR:
            raise ValueError(f"Gate type {gate.gate_type} is not supported")
        else:
            operator_str = MAP_GATE_TYPE_TO_OPERATOR_STR[gate.gate_type]
            gate_str = f'wires[{gate.output_wire}] = wires[{gate.inputs_wires[0]}] {operator_str} wires[{gate.inputs_wires[1]}]'
        gates_str_list.append(gate_str)
    gates_str = '\n'.join(gates_str_list)

    print_outputs_str = '\n'.join(print_outputs_str_list)

    circuit_code = f"""wires = {inputs_str}
{gates_str}
# Print outputs
{print_outputs_str}
"""
    # circuit_name = arith_circuit_path.stem
    
    out_mpc_path = MPSPDZ_CIRCUIT_DIR / f"{circuit_name}.mpc"
    with open(out_mpc_path, 'w') as f:
        f.write(circuit_code)
    return out_mpc_path


# === HELPERS ===

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



def run_mpc(circuit_name, party_id, num_parties):
    cmd = [
        "./semi-party.x",
        "-N", str(num_parties),
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
        # print(stdout)

        # === SAVE OUTPUTS ===
        output_dir = MPSPDZ_PROJECT_ROOT / "mpc-results"
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / f"party{party_id}_risk_result.json"

        # === PARSE OUTPUT ===
    
        # fin_match = re.search(r'outputs\[\d+\]: 0\.fin=([0-9.]+)', stdout)
        fin_match = re.search(r'outputs\[\d+\]: 0\.fin=([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)', stdout)


        if fin_match:
            fin = float(fin_match.group(1))
            fin_unscaled = fin / 10 ** 7

            print(f"Parsed unscaled outputs for P{party_id}:")
            print(f"  • R_part (scaled): {fin}")
            print(f"  • R_part: {fin_unscaled}")
            print()
            

            with open(output_path, "w") as f:
                json.dump({
                    "fin": fin
                }, f, indent=2)

            if party_id == 0:
                init_output_path = MPC_CONFIG_DIR / f"output.json"
                with open(init_output_path, "w") as f:
                    json.dump({
                        "fin": fin_unscaled
                    }, f, indent=2)
                print(f"Saved results to {init_output_path}")

            # print(f"Saved results to {output_path}")
            return fin_unscaled

        else:
            print("error: Couldnt find expected output values in stdout")
            return None

    except subprocess.CalledProcessError as e:
        print(f"MPC for party {party_id} failed!")
        print(f"Return Code: {e.returncode}")
        print(f"STDERR:\n{e.stderr}")
        print(f"STDOUT:\n{e.stdout}")
        sys.exit(1)


    

def workflow(party_id):

    mpc_settings_path = Path(f"{MPC_CONFIG_DIR}/mpc_settings.json")

    with open(mpc_settings_path, 'r') as f:
        mpc_settings = json.load(f)
    num_parties = len(mpc_settings)

    bristol_path = MPC_CONFIG_DIR / "circuit.txt"
    circuit_info_path = MPC_CONFIG_DIR / "circuit_info.json"
    
    mpc_circuit_name = f"risk_{party_id}"

    # Step 2: generate MP-SPDZ circuit
    mpspdz_circuit_path = generate_mpspdz_circuit(
        bristol_path,    # circuit.txt
        circuit_info_path,   #circuit_info.json
        mpc_settings_path,
        mpc_circuit_name
    )

    print(f"Generated MP-SPDZ circuit at {mpspdz_circuit_path}")

    # Step 3: generate MP-SPDZ inputs for party
    input_json_for_party_path = Path(f"{MPC_INPUTS_DIR}/inputs_party_{party_id}.json")
    if not input_json_for_party_path.exists():
        print(f"error: pdata file missing for party {party_id}: {input_json_for_party_path}")
        sys.exit(1)

    generate_mpspdz_inputs_for_party(
        party_id,
        input_json_for_party_path,
        mpc_circuit_name,
        circuit_info_path,
        mpc_settings_path,
    )

    # Step 4: compile the circuit
    compile_circuit(mpc_circuit_name)

    # Step 5: start the MPC with other parties
    return run_mpc(mpc_circuit_name, party_id, num_parties)



# === MAIN ===

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 run_comp_party.py [party_id]")
        sys.exit(1)

    party_id = int(sys.argv[1])

    risk = workflow(
        party_id
    )


if __name__ == "__main__":
    main()

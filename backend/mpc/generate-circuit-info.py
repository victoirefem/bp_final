import os
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent
BACKEND_ROOT = PROJECT_ROOT / 'backend'
MPC_CONFIG_DIR = BACKEND_ROOT / 'mpc' / 'mpc-config'
MPC_CIRCUITS_DIR = BACKEND_ROOT / 'mpc' / 'mpc-circuits'
CIRCOM_2_ARITHC_PROJECT_ROOT = PROJECT_ROOT / 'circom-2-arithc'



mpc_settings_path = Path(f"{MPC_CONFIG_DIR}/mpc_settings.json")

with open(mpc_settings_path, 'r') as f:
        mpc_settings = json.load(f)

num_parties = len(mpc_settings)

circom_path = MPC_CIRCUITS_DIR / f"risk{num_parties}.circom"

# Run circom-2-arithc
code = os.system(f"cd {CIRCOM_2_ARITHC_PROJECT_ROOT} && ./target/release/circom-2-arithc --input {circom_path} --output {MPC_CONFIG_DIR}")
if code != 0:
    raise ValueError(f"Failed to compile circom. Error code: {code}")
else:
    print(f"Compiled circuit to arithc for {num_parties} parties")
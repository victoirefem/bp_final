## Anvil

Instructions at: [Anvil](https://medium.com/@maria.magdalena.makeup/foundry-anvil-a-local-ethereum-node-for-development-642ca28f7892)

## Scripts (Client Ledger)

```python
cd client-ledger
```

### Deploy contract:

```python
node script/deploy.js
```

### Commit profiles

```python
node helpers/generateSalt.js [partyid]
node helpers/generateProfiles.js [partyid] [type: client, prf]
node script/commit.js [partyid] [type: client, prf]
```

### Update profiles

```python
node helpers/generateProfiles.js [partyid] [type: client, prf]
node script/update.js
```


### Inspect Ledger

```python
node script/inspectLedger.js
```

### Generate proof

```python
node helpers/generateCircuitInputs.js [partyid]
run circom commands (r1cs, zkey, verification_key)...
 then generate witness
```

## MPC Scripts

### Deploy MPC contract:

```python
node script/deployMpc.js
```

### Interact 
```python
export BANK_INDEX=

node client-ledger/script/interactMpc.js createSession

node client-ledger/script/interactMpc.js joinSession --session [session_id]

node client-ledger/script/interactMpc.js startSession --session [session_id]

node client-ledger/script/interactMpc.js finishSession --session [session_id]
```

### Inspect MPC

```python
node script/inspectMpc.js --session [session_id]
```

### Set listener

```python
python3 event_listener.py
```

## Circom
```python
# Step 1: write circuits
# ----------------------
# Step 2: generate circuits
circom circuits/circom/input.circom --r1cs --wasm --sym -o circuits/build

# Step 3: copy powers of tau

# Step 4: snarkjs setup
snarkjs groth16 setup circuits/build/input.r1cs circuits/ptau/pot10.ptau circuits/build/input.zkey

# Step 5: export verification key
snarkjs zkey export verificationkey circuits/build/input.zkey circuits/build/verification_key.json

# Step 6: create input.json (take them from examples/aml)
# -----------------------

# Step 7: generate witness - continue
node circuits/build/input_js/generate_witness.js circuits/build/input_js/input.wasm client-ledger/data/bank2/pdata/1488_202504.json circuits/build/witness.wtns

# Step 8: generate proof
snarkjs groth16 prove circuits/build/input.zkey circuits/build/witness.wtns circuits/build/proof.json circuits/build/public.json

# Step 9: verify proof
snarkjs groth16 verify circuits/build/verification_key.json circuits/build/public.json circuits/build/proof.json
```

## MP-SPDZ

Instructions at: [circom-mp-spdz](https://hackmd.io/Iuu9yge4ShKBjawAcmFjvw?view) (2: Run parties in different machines)
## Anvil

Instructions at: [Anvil](https://medium.com/@maria.magdalena.makeup/foundry-anvil-a-local-ethereum-node-for-development-642ca28f7892)

## Tools (change directories in the files)

```python
node bank_data/tools/hash.js 20
node bank_data/tools/filterClient.js 20 80BC62F10
```

## Blockchain scripts


### Deploy:

```python
node blockchain/scripts/deployTx.js
node blockchain/scripts/deployRisk.js
```


### Record Txs and risks from clients folder

```python
node blockchain/scripts/recordTxs.js 20 80BC62F10
node blockchain/scripts/recordRisks.js 20 80BC62F10 [clientId2 ...]
```

## Backend Preprocessing
```python
python3 backend/pdata/generate-pdata.py 20 80BC62F10 <r/i>
```

## ZK

```python
# Public and private inputs => generate proof
node backend/zk/get-commitments.js 20 <r/i>
node backend/zk/get-private-data.js 20 <r/i>
python3 backend/zk/generate-circuit.py 20 <r/i>
python3 backend/zk/generate-proof-party.py 20
```

## MPC workflow

```python
python3 backend/mpc/run-risk-party.py 20
```







<!-- ## Scripts - MPC contract

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
``` -->




## Circom

## Generate proof

```python
node helpers/generateCircuitInputs.js [partyid]
run circom commands (r1cs, zkey, verification_key)...
 then generate witness
 ```

```python

# Step 1: generate circuits
circom circuits/circom/txcheck.circom --r1cs --wasm --sym -o circuits/build/{bankId}

# Step 2: snarkjs setup
snarkjs groth16 setup circuits/build/{bankId}/txcheck.r1cs circuits/ptau/pot10.ptau circuits/build/{bankId}/txcheck.zkey

# Step 3: export verification key
snarkjs zkey export verificationkey circuits/build/{bankId}/txcheck.zkey circuits/build/{bankId}/verification_key.json


# Step 4: generate witness 
node circuits/build/{bankId}/txcheck_js/generate_witness.js circuits/build/{bankId}/txcheck_js/txcheck.wasm privatedata/{bankId}.json circuits/build/{bankId}/witness.wtns

# Step 5: generate proof
snarkjs groth16 prove circuits/build/txcheck.zkey circuits/build/{bankId}/witness.wtns circuits/build/{bankId}/proof.json circuits/build/{bankId}/public.json

# Step 6: verify proof
snarkjs groth16 verify circuits/build/{bankId}/verification_key.json circuits/build/{bankId}/public.json circuits/build/{bankId}/proof.json
```

## MP-SPDZ

Instructions at: [circom-mp-spdz](https://hackmd.io/Iuu9yge4ShKBjawAcmFjvw?view) (2: Run parties in different machines)
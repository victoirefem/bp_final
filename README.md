## Anvil

Instructions at: [Anvil](https://medium.com/@maria.magdalena.makeup/foundry-anvil-a-local-ethereum-node-for-development-642ca28f7892)

## Main

```python
python3 main.py
```


## Tools (DONE)

```python
### DONE ###
# Init bank
node bank_data/tools/hashClient.js 20 80BC62F10

# Joining banks
node bank_data/tools/hashClient.js 14 80BC61040
node bank_data/tools/hashClient.js 1467 8013C4030
node bank_data/tools/hashClient.js 9571 80BC614F0
node bank_data/tools/hashClient.js 18475 80BC62D30
node bank_data/tools/hashClient.js 21615 80BC61C70
node bank_data/tools/hashClient.js 224782 80BC62E20
```

## Blockchain scripts


### Deploy:

```python
### DONE ###
node blockchain/scripts/deploy.js
```
### Bank Id -> Bank Address

```python
### DONE ###
node bank_data/tools/generateBankMap.js --init 20 --j 14 1467 9571 18475 21615 224782
```

### Record Txs and risks from clients folder

```python
### DONE ###
# Init bank
node blockchain/scripts/recordTxs.js 80BC62F10
# node blockchain/scripts/recordRisks.js 20 80BC62F10 [clientId2 ...]

# Joining banks
node blockchain/scripts/recordRisks.js 1467 8013C4030
node blockchain/scripts/recordRisks.js 9571 80BC614F0
node blockchain/scripts/recordRisks.js 21615 80BC61C70
node blockchain/scripts/recordRisks.js 224782 80BC62E20
node blockchain/scripts/recordRisks.js 14 80BC61040
node blockchain/scripts/recordRisks.js 18475 80BC62D30
```



### Create Session (Init Bank):

```python
### DONE ###
node blockchain/scripts/create.js
```

## Join Session (Invited Banks)


```python
### DONE ###
node blockchain/scripts/join.js <sessionId>
```

## Start Session (Init Bank)


```python
### DONE ###
node blockchain/scripts/start.js <sessionId>
```

## Backend Preprocessing
```python
### DONE ###
# Init Bank
python3 backend/pdata/generate-pdata.py 20 80BC62F10 i

# Joining Banks
python3 backend/pdata/generate-pdata.py 1467 8013C4030 r
python3 backend/pdata/generate-pdata.py 9571 80BC614F0 r
python3 backend/pdata/generate-pdata.py 21615 80BC61C70 r
python3 backend/pdata/generate-pdata.py 224782 80BC62E20 r
python3 backend/pdata/generate-pdata.py 14 80BC61040 r
python3 backend/pdata/generate-pdata.py 18475 80BC62D30 r
```

## ZK

```python
# Public and private inputs => generate proof
# Init bank
node backend/scripts/run-zk.js 20 i

# Joining banks
node backend/scripts/run-zk.js 1467 r
node backend/scripts/run-zk.js 9571 r
node backend/scripts/run-zk.js 21615 r
node backend/scripts/run-zk.js 224782 r
node backend/scripts/run-zk.js 14 r
node backend/scripts/run-zk.js 18475 r
```

## MPC 

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
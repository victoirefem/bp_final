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
### DONE ###
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



## MP-SPDZ

Instructions at: [circom-mp-spdz](https://hackmd.io/Iuu9yge4ShKBjawAcmFjvw?view) (2: Run parties in different machines)
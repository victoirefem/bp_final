# Privacy-preserving collaboration between banks

The project simulates the session between banks for risk updating. After entering bank Id, we are acting on his behalf. With the client Id specified, the information about his risk score and associated accounts with their respective banks Id is displayed.

After the confirmation for updating the risk score, the whole session pipeline, together with ZKP generating and MPC will start.

## Prerequisites

1. Python 3.10.12
2. Node.js v20.12.0 and npm v10.5.0
3. npx is available
4. Working directory - the root of the project

## Before start





## Start

```python
python3 main.py
```


## Cases for testing

### Case1: 6 invited banks

```python
Init bank Id: 20
Client Id: 80BC62F10

### Files needed in bank_data/raw
20_income.csv
20_risks.csv

14_risks.csv
1467_risks.csv
18475_risks.csv
21615_risks.csv
224782_risks.csv
9571_risks.csv
```


### Case2: 2 invited banks

```python
Init bank Id: 148
Client Id: 804ABCE90

### Files needed in bank_data/raw
71_income.csv
71_risks.csv

24856_risks.csv
312283_risks.csv
```


### Case3: 5 invited banks

```python
Init bank Id: 148348
Client Id: 81203F670

### Files needed in bank_data/raw
148348_income.csv
148348_risks.csv

116_risks.csv
148016_risks.csv
348865_risks.csv
48308_risks.csv
48526_risks.csv
```

### Case4: 3 invited banks

```python
Init bank Id: 12
Client Id: 80044F690

### Files needed in bank_data/raw
12_income.csv
12_risks.csv

14290_risks.csv
20_risks.csv
23_risks.csv
```


### Case5: 8 invited banks

```python
Init Bank: 12
Client Id: 8006757B0

### Files needed in bank_data/raw
12_income.csv
12_risks.csv

111433_risks.csv
11157_risks.csv
112637_risks.csv
13037_risks.csv
1502_risks.csv
23833_risks.csv
2591_risks.csv
29089_risks.csv
```



## Anvil

Instructions at: [Anvil](https://medium.com/@maria.magdalena.makeup/foundry-anvil-a-local-ethereum-node-for-development-642ca28f7892)





## MP-SPDZ

Instructions at: [circom-mp-spdz](https://hackmd.io/Iuu9yge4ShKBjawAcmFjvw?view) (2: Run parties in different machines)
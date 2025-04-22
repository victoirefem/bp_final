import random


inlisttxt = "0.inlist";
intxt = "0.in";
# out1txt = "0.out1"
# out2txt = "0.out2"
# out3txt = "0.out3"
# out4txt = "0.out4"
# out5txt = "0.out5"
# out6txt = "0.out6"
# out7txt = "0.out7"
# out8txt = "0.out8"
# out9txt = "0.out9"
# out10txt = "0.out10"
# out11txt = "0.out11"
out1txt = "0.beta"
out2txt = "0.sum_no_sd"
# out3txt = "0.test"
# out4txt = "0.test1"
# out5txt = "0.test2"



M = 3; # 3 banks
N = 12;


list = []; # for mpc_settings.json (without inputs themselves)
inlistdictlist = []; # for inputs_party_*.json

for i in range(M):
    inlistdict = {}
    list.append({"name": f"p{i}", "inputs": [], "outputs": [out1txt, out2txt]})
    for j in range(N):
        inlistops = inlisttxt + "[" + str(i) + "]" + "[" + str(j) + "]"
        list[i]['inputs'].append(inlistops)
        
        # KYC
        if j == 0:
            value = random.randint(1, 3)
        # total income, expected income, credit limit
        elif j == 7 or j == 1 or j == 4:
            value = random.randint(0, 100000)
        # credit score
        elif j == 2:
            value = random.randint(1, 1000)
        # account tenure
        elif j == 3:
            value = random.randint(1, 360)
        # refund number
        elif j == 8:
            value = random.randint(0, 50)
        # credit usage - change
        elif j == 5:
            value = random.randint(0, inlistdict[inlisttxt + "[" + str(i) + "]" + "[" + str(j-1) + "]"])
        # high risk countries
        elif j == 10:
            value = random.randint(0, 15)
        # txs
        elif j == 9:
            value = random.randint(0, 10000)
        # countries
        elif j == 11:
            value = random.randint(0, 195)
        # pep
        elif j == 6:
            value = random.randint(0, 1)
        else:
            raise ValueError("Unsupported value of j")
        
        inlistdict[inlistops] = value
    inlistdictlist.append(inlistdict)

#print(list);
#for inlistdict in inlistdictlist:
#    print(inlistdict)
# print(in1dict);
# print(in2dict);





print("======== Intermediate values =========")
kyc = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[0]"] for i in range(M)) / M
kyc_comp = kyc/3

avg_income = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[1]"] for i in range(M)) / M
avg_expected_income = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[2]"] for i in range(M)) / M
result = 2 - (avg_income / avg_expected_income)
income_comp = min(result, 1)

avg_credit_score = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[3]"] for i in range(M)) / M
creditscore_comp = avg_credit_score/1000

avg_acc_tenure = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[4]"] for i in range(M)) / M
acctenure_comp = 0.3*avg_acc_tenure/360

var_acc_tenure = sum((inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[4]"] - avg_acc_tenure)**2 for i in range(M)) / (M-1)
sd_acc_tenure = var_acc_tenure**0.5

avg_refund = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[5]"] for i in range(M)) / M
refund_comp = avg_refund/50

avg_credit_amount = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[7]"] for i in range(M)) / M
avg_credit_limit = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[6]"] for i in range(M)) / M
credit_comp = avg_credit_amount/avg_credit_limit

avg_high_risk_countries = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[8]"] for i in range(M)) / M
avg_num_txs = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[9]"] for i in range(M)) / M
hrc_comp = 0.6 * avg_high_risk_countries/avg_num_txs

avg_countries = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[10]"] for i in range(M)) / M
countries_comp = 0.4*(avg_countries-1)/194

avg_pep = sum(inlistdictlist[i][inlisttxt + "[" + str(i) + "]" + "[11]"] for i in range(M)) / M
pep_comp = avg_pep


sum_comp = kyc_comp+income_comp+creditscore_comp+acctenure_comp-refund_comp-credit_comp-hrc_comp-countries_comp-pep_comp+4

# print("KYC (out1):", kyc_comp)
# print("Total vs. Expected Income (final, Min) (test):", income_comp)
# print("Credit Score (out3): ", creditscore_comp)
# print("Account Tenure (out4): ", acctenure_comp)
# print("Account Tenure SD: ", sd_acc_tenure)
# print("Refund (out6): ", refund_comp)
# print("Credit Amount vs. Credit Limit (out7): ", credit_comp)
# print("HRC vs. Num TXs (out8): ", hrc_comp)
# print("Countries (out9): ", countries_comp)
# print("PEP (out10): ", pep_comp)
# print("P(RF) (out11): ", avg_prf)

print("Account Tenure Variance (beta): ", var_acc_tenure)
print("Sum without sd (sumout): ", sum_comp)











import json
with open('mpc_settings_comp.json', 'w') as fp:
    json.dump(list, fp)

for i in range(M):
    with open(f"inputs_party_{i}.json", 'w') as fp:
        json.dump(inlistdictlist[i], fp)
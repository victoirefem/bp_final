pragma circom 2.1.0;

include "./templates/AvgDiv.circom";
include "./templates/Min2.circom";
include "./templates/Sum.circom";
include "./templates/Sd.circom";
// include "../../../circom-2-arithc/tests/circuits/machine-learning/util.circom";
// include "../../node_modules/circomlib/circuits/comparators.circom";
// include "../../node_modules/circomlib/circuits/mimcsponge.circom";



// M banks with N variables

template comp(M, N){

    signal input inlist[M][N];
    signal comp1;
    signal comp2;
    signal comp3;
    signal comp4;
    signal comp6;
    signal comp7;
    signal comp8;
    signal comp9;
    signal comp10;

    signal output beta;
    signal output sum_no_sd;

    // --- KYC
    component alpha1 = AvgDiv(M, N, 0, 3);
    alpha1.inlist <== inlist;

    // --- Total Income vs. Expected Income
    // sum[1]/sum[2]
    component alpha2 = Sum(M, N, 7, 1);
    alpha2.inlist <== inlist;

    component alpha3 = Sum(M, N, 1, 1);
    alpha3.inlist <== inlist;

    component alpha23 = Min2(1);
    alpha23.in <== 2 - alpha2.sum / alpha3.sum;

    // --- Credit Score
    component alpha4 = AvgDiv(M, N, 2, 1000);
    alpha4.inlist <== inlist;

    // --- Account Tenure
    component alpha5 = AvgDiv(M, N, 3, 1200);
    alpha5.inlist <== inlist;

    // TODO: take sqrt from variance + scaling
    component comp5 = Sd(M, N, 3);
    comp5.inlist <== inlist;

    // --- Refund Rate
    component alpha6 = AvgDiv(M, N, 8, 50);
    alpha6.inlist <== inlist;

    // --- Credit Amount vs. Credit Limit
    // sum[6]/sum[7]
    component alpha7 = Sum(M, N, 5, 1);
    alpha7.inlist <== inlist;

    component alpha8 = Sum(M, N, 4, 1);
    alpha8.inlist <== inlist;

    // --- HRC vs. Num of Txs
    // (6*sum[8])/(10*sum[9])
    component alpha9 = Sum(M, N, 10, 6);
    alpha9.inlist <== inlist;

    component alpha10 = Sum(M, N, 9, 10);
    alpha10.inlist <== inlist;

    // --- Countries
    // TODO: add 1/485
    component alpha11 = AvgDiv(M, N, 11, 485);
    alpha11.inlist <== inlist;

    // --- PEP
    component alpha12 = AvgDiv(M, N, 6, 1);
    alpha12.inlist <== inlist;


    comp1 <== alpha1.avgd;
    comp2 <== alpha23.min;
    comp3 <== alpha4.avgd;
    comp4 <== alpha5.avgd;
    comp6 <== alpha6.avgd;
    comp7 <== alpha7.sum / alpha8.sum;
    comp8 <== alpha9.sum / alpha10.sum;
    comp9 <== alpha11.avgd;
    comp10 <== alpha12.avgd;

    beta <== comp5.variance;
    sum_no_sd <== comp1+comp2+comp3+comp4-comp6-comp7-comp8-comp9-comp10 + 4;

}

component main = comp(3, 12);
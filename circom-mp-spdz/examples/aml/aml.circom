pragma circom 2.1.0;

include "./templates/Avg.circom";

// M banks w. gamma input
template aml(M) {

    signal input inlist[M];
    signal input bw;
    signal input pml;
    signal output fin;

    component gamma = Avg(M);
    gamma.inlist <== inlist;

    signal mult <== (1000-bw) * pml;
    fin <== mult / gamma.avg;

}

component main = aml(3);
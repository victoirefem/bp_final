pragma circom 2.1.0;

include "./templates/WeightSum.circom";

template risk(n){
    signal input w[n];
    signal input ri[n];

    var alpha = 5;

    signal output r_new;

    component csum = WeightSum(n);
    csum.w <== w;
    csum.ri <== ri;

    r_new <== alpha*csum.out;

}

component main = risk(3);
pragma circom 2.1.0;

include "../../../../circom-2-arithc/tests/circuits/machine-learning/circomlib/switcher.circom";
include "../../../../circom-2-arithc/tests/circuits/machine-learning/circomlib/comparators.circom";


template Min2(N) {

    signal input in;
    signal output min;

    signal in_lt <== (in < N);
    min <== in_lt * in + (1 - in_lt) * N;
    //min <== in_lt;
}

// template Min2(n) {
//     signal input in[n];
//     signal output min;

//     signal gts[n];        // store comparators
//     component switchers[n+1];  // switcher for comparing mins

//     signal mins[n+1];

//     mins[0] <== in[0];
//     for(var i = 0; i < n; i++) {
//         gts[i] <== (mins[i] > in[i]); 

//         switchers[i+1] = Switcher();

//         switchers[i+1].sel <== gts[i];
//         switchers[i+1].L <== mins[i];
//         switchers[i+1].R <== in[i];

//         mins[i+1] <== switchers[i+1].outL;
//     }

//     min <== mins[n];
// }


// template Min2(n, nBits) {
//     signal input in[n];     // Array of inputs
//     signal output min;      // Minimum value

//     signal mins[n + 1];     // Store intermediate minimums
//     signal gts[n];          // 1 if current input < current min
//     component switchers[n]; // Circomlib Switchers
//     component lt[n];        // LessThan comparators

//     mins[0] <== in[0];       // Start with first element

//     for (var i = 0; i < n - 1; i++) {
//         lt[i] = LessThan(nBits);
//         lt[i].in[0] <== in[i + 1];
//         lt[i].in[1] <== mins[i];
//         gts[i] <== lt[i].out; // 1 if in[i+1] < mins[i]

//         switchers[i] = Switcher();
//         switchers[i].sel <== gts[i];
//         switchers[i].L <== mins[i];
//         switchers[i].R <== in[i + 1];

//         mins[i + 1] <== switchers[i].outL;  // outL is the selected min
//     }

//     min <== mins[n - 1];
// }
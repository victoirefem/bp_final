pragma circom 2.1.0;

// K - value position
template Sum(M, N, K, mul) {
    
    signal input inlist[M][N];
    signal output sum;

    // [M] - final sum
    signal comp[M];
    comp[0] <== inlist[0][K];
    for (var i = 1; i < M; i++) {
        comp[i] <== comp[i-1] + inlist[i][K];
    }
    sum <== mul*comp[M-1];

}
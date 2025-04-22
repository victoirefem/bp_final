pragma circom 2.1.0;

// K - value position
template Avg(M) {
    
    signal input inlist[M];
    signal output avg;

    // [M] - final sum
    signal comp[M+1];
    comp[0] <== inlist[0];
    for (var i = 1; i < M; i++) {
        comp[i] <== comp[i-1] + inlist[i];
    }
    comp[M] <== comp[M-1] / M;

    avg <== comp[M];
}

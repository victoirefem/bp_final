pragma circom 2.1.0;

// K - value position
template AvgDiv(M, N, index, div) {
    
    signal input inlist[M][N];
    signal output avgd;

    // [M] - final sum
    signal comp[M+1];
    comp[0] <== inlist[0][index];
    for (var i = 1; i < M; i++) {
        comp[i] <== comp[i-1] + inlist[i][index];
    }
    var divisor = M * div;
    comp[M] <== comp[M-1] / divisor;

    avgd <== comp[M];
}

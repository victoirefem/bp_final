pragma circom 2.1.0;

include "./Sum.circom";
include "./AvgDiv.circom";


template Sd(M, N, index) {

    signal input inlist[M][N];
    signal output variance;

    component mean = AvgDiv(M, N, index, 1);
    mean.inlist <== inlist;
    
    signal sqdiff[M+1];
    sqdiff[0] <== (inlist[0][index] - mean.avgd) ** 2;

    for (var i = 1; i < M; i++) {
        sqdiff[i] <== sqdiff[i-1] + (inlist[i][index] - mean.avgd) ** 2;
    }

    sqdiff[M] <== sqdiff[M-1] / (M-1);

    variance <== sqdiff[M];
  
}
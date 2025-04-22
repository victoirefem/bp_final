pragma circom 2.1.0;

include "./templates/poseidon.circom";

template InputCheck() {

    // === Public inputs
    signal input staticCommitment;
    signal input txCommitment;
    signal input prfCommitment;

    // === Private inputs
    signal input ssn;
    signal input client_salt;
    signal input pdata[12]; // [0-6]: static, [7-11]: tx
    signal input prf_salt;
    signal input prf_pdata;

    // === Static profile
    component hashStatic = Poseidon(9);
    hashStatic.inputs[0] <== ssn;
    for (var i = 0; i < 7; i++) {
        hashStatic.inputs[i + 1] <== pdata[i];
    }
    hashStatic.inputs[8] <== client_salt;

    // === Tx profile
    component hashTx = Poseidon(7);
    hashTx.inputs[0] <== ssn;
    for (var i = 0; i < 5; i++) {
        hashTx.inputs[i + 1] <== pdata[i + 7];
    }
    hashTx.inputs[6] <== client_salt;

    // === Prf profile
    component hashPrf = Poseidon(2);
    hashPrf.inputs[0] <== prf_pdata;
    hashPrf.inputs[1] <== prf_salt;


    // === CHECK
    hashStatic.out === staticCommitment;
    hashTx.out === txCommitment;
    hashPrf.out === prfCommitment;

}

component main {public [staticCommitment, txCommitment, prfCommitment]} = InputCheck();
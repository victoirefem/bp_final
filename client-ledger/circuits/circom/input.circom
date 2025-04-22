pragma circom 2.1.0;

include "./templates/poseidon.circom";

template InputCheck() {

    // === Public inputs
    signal input staticCommitment;
    signal input txCommitment;

    // === Private inputs
    signal input ssn;
    signal input salt;
    signal input pdata[12]; // [0-6]: static, [7-11]: tx

    // === Static profile
    component hashStatic = Poseidon(9);
    hashStatic.inputs[0] <== ssn;
    for (var i = 0; i < 7; i++) {
        hashStatic.inputs[i + 1] <== pdata[i];
    }
    hashStatic.inputs[8] <== salt;

    // === Tx profile
    component hashTx = Poseidon(7);
    hashTx.inputs[0] <== ssn;
    for (var i = 0; i < 5; i++) {
        hashTx.inputs[i + 1] <== pdata[i + 7];
    }
    hashTx.inputs[6] <== salt;

    // === CHECK
    hashStatic.out === staticCommitment;
    hashTx.out === txCommitment;

}

component main {public [staticCommitment, txCommitment]} = InputCheck();
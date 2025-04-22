pragma circom 2.1.0;

template Switcher2() {
    signal input sel; // 0 or 1
    signal input L;   // value if sel == 0
    signal input R;   // value if sel == 1

    signal output out;

    // Enforce sel ∈ {0,1}
    sel * sel === sel;

    // Switch logic: out = sel * R + (1 - sel) * L
    out <== sel * R + (1 - sel) * L;
}
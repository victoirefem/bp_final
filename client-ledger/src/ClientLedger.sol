// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


contract ClientLedger {

    address public amlRegulator;
    mapping(address => bool) public isBank;

    constructor(address _amlRegulator) {
        amlRegulator = _amlRegulator;
    }

    struct Commitment {
        bytes32 hash;       // commitment = hash(SSN || profileData || salt)
        uint256 month;      // Format: YYYYMM (e.g., 202504)
        string metadata;    // Optional: version info, notes, etc.
    }

    // Commitments: bank => month => commitment
    mapping(address => mapping(uint256 => Commitment)) public staticCommitments;
    mapping(address => mapping(uint256 => Commitment)) public txCommitments;
    mapping(address => mapping(uint256 => Commitment)) public rfCommitments;


    // === MODIFIERS ===

    modifier onlyBank() {
        require(isBank[msg.sender], "Only authorized banks can commit");
        _;
    }

    modifier onlyRegulator() {
        require(msg.sender == amlRegulator, "Only the AML regulator can call this function");
        _;
    }


    // === Events ===
    event StaticCommitted(address indexed bank, bytes32 indexed hash, uint256 indexed month);
    event TxCommitted(address indexed bank, bytes32 indexed hash, uint256 indexed month);
     event StaticDeleted(address indexed bank, uint256 indexed month);
    event TxDeleted(address indexed bank, uint256 indexed month);
    event StaticUpdated(address indexed bank, bytes32 indexed newHash, uint256 indexed month);
    event TxUpdated(address indexed bank, bytes32 indexed newHash, uint256 indexed month);
    event RFCommitted(address indexed bank, bytes32 indexed hash, uint256 indexed month);
    event RFUpdated(address indexed bank, bytes32 indexed newHash, uint256 indexed month);


    // === COMMITMENTS ===

    // Static commit
    function commitStatic(
        bytes32 commitmentHash, 
        uint256 month, 
        string memory metadata
    ) external onlyBank {

        require(staticCommitments[msg.sender][month].hash == 0x0, "Static commitment already exists for this month");

        staticCommitments[msg.sender][month] = Commitment({
            hash: commitmentHash,
            month: month,
            metadata: metadata
        });

        emit StaticCommitted(msg.sender, commitmentHash, month);
    }

    // TX commit
    function commitTx(
        bytes32 commitmentHash, 
        uint256 month, 
        string memory metadata
    ) external onlyBank {

        require(txCommitments[msg.sender][month].hash == 0x0, "Tx commitment already exists for this month");

        txCommitments[msg.sender][month] = Commitment({
            hash: commitmentHash,
            month: month,
            metadata: metadata
        });

        emit TxCommitted(msg.sender, commitmentHash, month);
    }

    // RF commit
    function commitRF(
        bytes32 commitmentHash,
        uint256 month,
        string memory metadata
    ) external onlyBank {
        require(rfCommitments[msg.sender][month].hash == 0x0, "RF commitment already exists for this month");

        rfCommitments[msg.sender][month] = Commitment({
            hash: commitmentHash,
            month: month,
            metadata: metadata
        });

        emit RFCommitted(msg.sender, commitmentHash, month);
    }

    // === UPDATE
    function updateStatic(
        bytes32 newHash, 
        uint256 month, 
        string memory newMetadata
    ) external onlyBank {
        require(staticCommitments[msg.sender][month].hash != 0x0, "No static commitment exists");
        staticCommitments[msg.sender][month] = Commitment(newHash, month, newMetadata);
        emit StaticUpdated(msg.sender, newHash, month);
    }

    function updateTx(
        bytes32 newHash, 
        uint256 month, 
        string memory newMetadata
    ) external onlyBank {
        require(txCommitments[msg.sender][month].hash != 0x0, "No tx commitment exists");
        txCommitments[msg.sender][month] = Commitment(newHash, month, newMetadata);
        emit TxUpdated(msg.sender, newHash, month);
    }

    function updateRF(
        bytes32 newHash,
        uint256 month,
        string memory metadata
    ) external onlyBank {
        require(rfCommitments[msg.sender][month].hash != 0x0, "No RF commitment exists for this month");

        rfCommitments[msg.sender][month] = Commitment({
            hash: newHash,
            month: month,
            metadata: metadata
        });

        emit RFUpdated(msg.sender, newHash, month);
    }


    // === GETTERS ===
    function getStaticCommitment(address bank, uint256 month)
     external view onlyRegulator returns (bytes32, string memory) {
        Commitment memory c = staticCommitments[bank][month];
        return (c.hash, c.metadata);
    }

    function getTxCommitment(address bank, uint256 month)
     external view onlyRegulator returns (bytes32, string memory) {
        Commitment memory c = txCommitments[bank][month];
        return (c.hash, c.metadata);
    }

    function getRFCommitment(address bank, uint256 month)
    external view onlyRegulator returns (bytes32, string memory) {
        Commitment memory c = rfCommitments[bank][month];
        return (c.hash, c.metadata);
    }

    // === SETTERS ===

    function setBank(address bank, bool authorized) external onlyRegulator {
        isBank[bank] = authorized;
    }
}

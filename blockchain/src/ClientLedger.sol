// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ClientLedger {

    struct Commitment {
        bytes32 hash;       // commitment = hash(SSN || profileData || salt)
        uint256 month;      // format: YYYYMM
        string metadata;    // optional
    }

    // Commitments: bank => month => commitment
    mapping(address => mapping(uint256 => Commitment)) public staticCommitments;
    mapping(address => mapping(uint256 => Commitment)) public txCommitments;
    mapping(address => mapping(uint256 => Commitment)) public rfCommitments;

    // === Events ===
    event StaticCommitted(address indexed bank, bytes32 indexed hash, uint256 indexed month);
    event TxCommitted(address indexed bank, bytes32 indexed hash, uint256 indexed month);
    event RFCommitted(address indexed bank, bytes32 indexed hash, uint256 indexed month);
    event StaticUpdated(address indexed bank, bytes32 indexed newHash, uint256 indexed month);
    event TxUpdated(address indexed bank, bytes32 indexed newHash, uint256 indexed month);
    event RFUpdated(address indexed bank, bytes32 indexed newHash, uint256 indexed month);

    // === COMMITMENTS ===

    function commitStatic(
        bytes32 commitmentHash, 
        uint256 month, 
        string memory metadata
    ) external {
        require(staticCommitments[msg.sender][month].hash == 0x0, "Static commitment already exists");
        staticCommitments[msg.sender][month] = Commitment(commitmentHash, month, metadata);
        emit StaticCommitted(msg.sender, commitmentHash, month);
    }

    function commitTx(
        bytes32 commitmentHash, 
        uint256 month, 
        string memory metadata
    ) external {
        require(txCommitments[msg.sender][month].hash == 0x0, "Tx commitment already exists");
        txCommitments[msg.sender][month] = Commitment(commitmentHash, month, metadata);
        emit TxCommitted(msg.sender, commitmentHash, month);
    }

    function commitRF(
        bytes32 commitmentHash,
        uint256 month,
        string memory metadata
    ) external {
        require(rfCommitments[msg.sender][month].hash == 0x0, "RF commitment already exists");
        rfCommitments[msg.sender][month] = Commitment(commitmentHash, month, metadata);
        emit RFCommitted(msg.sender, commitmentHash, month);
    }

    // === UPDATE ===

    function updateStatic(
        bytes32 newHash, 
        uint256 month, 
        string memory metadata
    ) external {
        require(staticCommitments[msg.sender][month].hash != 0x0, "No static commitment exists");
        staticCommitments[msg.sender][month] = Commitment(newHash, month, metadata);
        emit StaticUpdated(msg.sender, newHash, month);
    }

    function updateTx(
        bytes32 newHash, 
        uint256 month, 
        string memory metadata
    ) external {
        require(txCommitments[msg.sender][month].hash != 0x0, "No tx commitment exists");
        txCommitments[msg.sender][month] = Commitment(newHash, month, metadata);
        emit TxUpdated(msg.sender, newHash, month);
    }

    function updateRF(
        bytes32 newHash,
        uint256 month,
        string memory metadata
    ) external {
        require(rfCommitments[msg.sender][month].hash != 0x0, "No RF commitment exists");
        rfCommitments[msg.sender][month] = Commitment(newHash, month, metadata);
        emit RFUpdated(msg.sender, newHash, month);
    }

    // === GETTERS ===

    function getStaticCommitment(address bank, uint256 month)
        external view returns (bytes32, string memory)
    {
        Commitment memory c = staticCommitments[bank][month];
        return (c.hash, c.metadata);
    }

    function getTxCommitment(address bank, uint256 month)
        external view returns (bytes32, string memory)
    {
        Commitment memory c = txCommitments[bank][month];
        return (c.hash, c.metadata);
    }

    function getRFCommitment(address bank, uint256 month)
        external view returns (bytes32, string memory)
    {
        Commitment memory c = rfCommitments[bank][month];
        return (c.hash, c.metadata);
    }
}

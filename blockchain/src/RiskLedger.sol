// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RiskLedger {
    struct RiskEntry {
        bytes32 hash;       // hash of the (account, risk score)
        uint256 timestamp;  // block timestamp when recorded
    }

    // bank address => list of risk entries
    mapping(address => RiskEntry[]) private risks;

    // bank address => (riskHash => index+1)
    mapping(address => mapping(bytes32 => uint256)) public riskIndexByHash;

    event RiskRecorded(
        address indexed bank,
        bytes32 indexed hash,
        uint256 timestamp
    );

    /// @notice Record a hashed risk entry
    function recordRisk(bytes32 riskHash) external {
        require(riskIndexByHash[msg.sender][riskHash] == 0, "Risk already recorded");

        RiskEntry memory entry = RiskEntry({
            hash: riskHash,
            timestamp: block.timestamp
        });

        risks[msg.sender].push(entry);
        riskIndexByHash[msg.sender][riskHash] = risks[msg.sender].length; // store index+1

        emit RiskRecorded(msg.sender, riskHash, block.timestamp);
    }

    /// @notice Get the number of recorded risks by a bank
    function getRiskCount(address bank) external view returns (uint256) {
        return risks[bank].length;
    }

    function getRisksFromBank(address bank)
        external
        view
        returns (bytes32[] memory hashes, uint256[] memory timestamps)
    {
        uint256 count = risks[bank].length;
        hashes = new bytes32[](count);
        timestamps = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            hashes[i] = risks[bank][i].hash;
            timestamps[i] = risks[bank][i].timestamp;
        }
    }


    /// @notice Get a risk entry by hash
    function getRiskByHash(address bank, bytes32 riskHash)
        external view returns (bytes32 hash, uint256 timestamp)
    {
        uint256 idx = riskIndexByHash[bank][riskHash];
        require(idx > 0, "Risk not found");

        RiskEntry memory entry = risks[bank][idx - 1];
        return (entry.hash, entry.timestamp);
    }
}

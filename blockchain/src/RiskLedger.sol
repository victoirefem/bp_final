// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RiskLedger {
    struct RiskScore {
        bytes32 hash;       // hash of private risk score data
        uint256 timestamp;  // when it was recorded
    }

    // bank address => list of risk scores
    mapping(address => RiskScore[]) private riskScores;

    event RiskScoreRecorded(
        address indexed bank,
        bytes32 indexed hash,
        uint256 timestamp
    );

    /// @notice Record a hashed risk score
    function recordRiskScore(bytes32 riskHash) external {
        RiskScore memory score = RiskScore({
            hash: riskHash,
            timestamp: block.timestamp
        });

        riskScores[msg.sender].push(score);
        emit RiskScoreRecorded(msg.sender, riskHash, block.timestamp);
    }

    /// @notice Get number of risk scores recorded by a bank
    function getRiskScoreCount(address bank) external view returns (uint256) {
        return riskScores[bank].length;
    }

    /// @notice Get a specific risk score by index
    function getRiskScore(address bank, uint256 index)
        external view returns (bytes32 hash, uint256 timestamp)
    {
        RiskScore memory score = riskScores[bank][index];
        return (score.hash, score.timestamp);
    }
}

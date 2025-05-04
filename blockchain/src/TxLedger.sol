// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TxLedger {
    struct Transaction {
        bytes32 hash;       // hash of the private transaction data
        uint256 timestamp;  // block timestamp when recorded
    }

    // bank address => list of transactions
    mapping(address => Transaction[]) private transactions;

    event TransactionRecorded(
        address indexed bank,
        bytes32 indexed hash,
        uint256 timestamp
    );

    /// @notice Record a hashed transaction
    function recordTransaction(bytes32 txHash) external {
        Transaction memory txRecord = Transaction({
            hash: txHash,
            timestamp: block.timestamp
        });

        transactions[msg.sender].push(txRecord);
        emit TransactionRecorded(msg.sender, txHash, block.timestamp);
    }

    /// @notice Get the number of recorded transactions by a bank
    function getTransactionCount(address bank) external view returns (uint256) {
        return transactions[bank].length;
    }

    /// @notice Get a specific transaction by index
    function getTransaction(address bank, uint256 index)
        external view returns (bytes32 hash, uint256 timestamp)
    {
        Transaction memory txRecord = transactions[bank][index];
        return (txRecord.hash, txRecord.timestamp);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TxLedger {
    struct Transaction {
        bytes32 hash;       
        uint256 timestamp;  
    }

    // bank address => list of txs
    mapping(address => Transaction[]) private transactions;
    mapping(address => mapping(bytes32 => uint256)) public txIndexByHash;

    event TransactionRecorded(
        address indexed bank,
        bytes32 indexed hash,
        uint256 timestamp
    );

    /// @notice Record a hashed transaction
    function recordTransaction(bytes32 txHash) external {
        require(txIndexByHash[msg.sender][txHash] == 0, "Already recorded");

        Transaction memory txRecord = Transaction({
            hash: txHash,
            timestamp: block.timestamp
        });

        transactions[msg.sender].push(txRecord);
        txIndexByHash[msg.sender][txHash] = transactions[msg.sender].length; // store index+1
        emit TransactionRecorded(msg.sender, txHash, block.timestamp);
    }

    /// @notice Get the number of recorded transactions by a bank
    function getTransactionCount(address bank) external view returns (uint256) {
        return transactions[bank].length;
    }

    /// @notice Get all transactions recorded by a bank
    function getTransactionsFromBank(address bank)
        external
        view
        returns (bytes32[] memory hashes, uint256[] memory timestamps)
    {
        uint256 count = transactions[bank].length;
        hashes = new bytes32[](count);
        timestamps = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            hashes[i] = transactions[bank][i].hash;
            timestamps[i] = transactions[bank][i].timestamp;
        }
    }



    /// @notice Retrieve a transaction by its hash for the calling bank
    function getTransactionByHash(bytes32 txHash)
        external
        view
        returns (bytes32 hash, uint256 timestamp)
    {
        uint256 idx = txIndexByHash[msg.sender][txHash];
        require(idx > 0, "Transaction not found");

        Transaction memory txRecord = transactions[msg.sender][idx - 1];
        return (txRecord.hash, txRecord.timestamp);
}


}


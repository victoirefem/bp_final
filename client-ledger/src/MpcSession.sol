// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract MpcSession {
    enum SessionStatus { Created, Active, Finished, Aborted }

    struct Session {
        uint256 sessionId;
        string clientId;
        address initiator;
        address[] joinedBanks;
        mapping(address => bool) hasJoined;
        SessionStatus status;
        bytes32 finHash; 
    }

    uint256 public nextSessionId;
    mapping(uint256 => Session) private sessions;

    event SessionCreated(uint256 indexed sessionId, string clientId, address initiator);
    event BankJoined(uint256 indexed sessionId, address bank);
    event SessionStarted(uint256 indexed sessionId);
    event SessionFinished(uint256 indexed sessionId, bytes32 finHash);
    event SessionAborted(uint256 indexed sessionId);

    function createSession(string memory clientId) external returns (uint256) {
        uint256 sessionId = nextSessionId++;
        Session storage s = sessions[sessionId];
        s.sessionId = sessionId;
        s.clientId = clientId;
        s.initiator = msg.sender;
        s.status = SessionStatus.Created;

        // Auto-join initiator
        s.joinedBanks.push(msg.sender);
        s.hasJoined[msg.sender] = true;

        emit SessionCreated(sessionId, clientId, msg.sender);
        emit BankJoined(sessionId, msg.sender);

        return sessionId;
    }

    function joinSession(uint256 sessionId) external {
        Session storage s = sessions[sessionId];
        require(s.status == SessionStatus.Created, "Session not open for joining");
        require(!s.hasJoined[msg.sender], "Already joined");
        require(sessionId < nextSessionId, "Session does not exist");

        s.joinedBanks.push(msg.sender);
        s.hasJoined[msg.sender] = true;

        emit BankJoined(sessionId, msg.sender);
    }

    function startSession(uint256 sessionId) external {
        Session storage s = sessions[sessionId];
        require(msg.sender == s.initiator, "Only initiator can start the session");
        require(s.status == SessionStatus.Created, "Session cannot be started");
        require(s.joinedBanks.length > 0, "No participants");
        require(sessionId < nextSessionId, "Session does not exist");

        s.status = SessionStatus.Active;

        emit SessionStarted(sessionId);
    }

    function finishSession(uint256 sessionId, bytes32 finHash) external {
        Session storage s = sessions[sessionId];
        require(msg.sender == s.initiator, "Only initiator can finish the session");
        require(s.status == SessionStatus.Active, "Session must be active to finish");
        require(sessionId < nextSessionId, "Session does not exist");

        s.finHash = finHash;
        s.status = SessionStatus.Finished;

        emit SessionFinished(sessionId, finHash);
    }

    function abortSession(uint256 sessionId) external {
        Session storage s = sessions[sessionId];
        require(msg.sender == s.initiator, "Only initiator can abort");
        require(s.status == SessionStatus.Created || s.status == SessionStatus.Active, "Session cannot be aborted");
        require(sessionId < nextSessionId, "Session does not exist");

        s.status = SessionStatus.Aborted;

        emit SessionAborted(sessionId);
    }

    // View functions
    function getSessionParticipants(uint256 sessionId) external view returns (address[] memory) {
        return sessions[sessionId].joinedBanks;
    }

    function getSessionStatus(uint256 sessionId) external view returns (SessionStatus) {
        return sessions[sessionId].status;
    }

    function getSessionFinHash(uint256 sessionId) external view returns (bytes32) {
        require(sessions[sessionId].status == SessionStatus.Finished, "Session not finished yet");
        return sessions[sessionId].finHash;
    }

    function getSessionClientId(uint256 sessionId) external view returns (string memory) {
        require(sessionId < nextSessionId, "Session does not exist");
        return sessions[sessionId].clientId;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MpcSession {
    enum SessionStatus { Created, Active, Completed, Aborted }

    struct Session {
        uint256 sessionId;
        bytes32 clientIdHash;
        address initiator;
        address[] invitedBanks;
        address[] joinedBanks;
        mapping(address => bool) isInvited;
        mapping(address => bool) hasJoined;
        uint256 deadline;
        SessionStatus status;
    }

    uint256 public nextSessionId;
    mapping(uint256 => Session) public sessions;

    event SessionCreated(uint256 indexed sessionId, bytes32 clientIdHash, address initiator, uint256 deadline);
    event BankJoined(uint256 indexed sessionId, address bank);
    event SessionStarted(uint256 indexed sessionId);
    event SessionCompleted(uint256 indexed sessionId);
    event SessionAborted(uint256 indexed sessionId);

    function createSession(bytes32 clientIdHash, address[] memory invitedBanks, uint256 durationMinutes) external returns (uint256) {
        require(invitedBanks.length > 0, "Must invite at least one bank");

        uint256 sessionId = nextSessionId++;
        Session storage s = sessions[sessionId];
        s.sessionId = sessionId;
        s.clientIdHash = clientIdHash;
        s.initiator = msg.sender;
        s.deadline = block.timestamp + (durationMinutes * 1 minutes);
        s.status = SessionStatus.Created;

        for (uint256 i = 0; i < invitedBanks.length; i++) {
            s.invitedBanks.push(invitedBanks[i]);
            s.isInvited[invitedBanks[i]] = true;
        }

        emit SessionCreated(sessionId, clientIdHash, msg.sender, s.deadline);
        return sessionId;
    }

    function joinSession(uint256 sessionId) external {
        Session storage s = sessions[sessionId];
        require(block.timestamp <= s.deadline, "Session joining deadline passed");
        require(s.status == SessionStatus.Created, "Session already started or closed");
        require(s.isInvited[msg.sender], "Not invited to this session");
        require(!s.hasJoined[msg.sender], "Already joined");

        s.joinedBanks.push(msg.sender);
        s.hasJoined[msg.sender] = true;

        emit BankJoined(sessionId, msg.sender);
    }

    function startSession(uint256 sessionId) external {
        Session storage s = sessions[sessionId];
        require(msg.sender == s.initiator, "Only initiator can start the session");
        require(s.status == SessionStatus.Created, "Session already started or closed");
        require(block.timestamp >= s.deadline, "Cannot start session before deadline");
        require(s.joinedBanks.length > 0, "At least one bank must join to start");

        s.status = SessionStatus.Active;

        emit SessionStarted(sessionId);
    }

    function completeSession(uint256 sessionId) external {
        Session storage s = sessions[sessionId];
        require(msg.sender == s.initiator, "Only initiator can complete the session");
        require(s.status == SessionStatus.Active, "Session must be active to complete");

        s.status = SessionStatus.Completed;

        emit SessionCompleted(sessionId);
    }

    function abortSession(uint256 sessionId) external {
        Session storage s = sessions[sessionId];
        require(msg.sender == s.initiator, "Only initiator can abort the session");
        require(s.status == SessionStatus.Created || s.status == SessionStatus.Active, "Session cannot be aborted now");

        s.status = SessionStatus.Aborted;

        emit SessionAborted(sessionId);
    }

    function getSessionParticipants(uint256 sessionId) external view returns (address[] memory) {
        return sessions[sessionId].joinedBanks;
    }

    function getInvitedBanks(uint256 sessionId) external view returns (address[] memory) {
        return sessions[sessionId].invitedBanks;
    }

    function getSessionStatus(uint256 sessionId) external view returns (SessionStatus) {
        return sessions[sessionId].status;
    }
}
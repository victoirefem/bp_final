// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SessionManager {
    enum SessionState { Created, Joined, Started, ProofsSubmitted, Finished }

    struct ProofData {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[] publicSignals;
        bool submitted;
    }

    struct Session {
        address initiator;
        address[] participants;
        mapping(address => bool) joined;
        mapping(address => ProofData) proofs;
        uint256 joinDeadline;
        SessionState state;
    }

    uint256 public sessionCount;
    mapping(uint256 => Session) private sessions;

    event SessionCreated(uint256 sessionId, address initiator, address[] invited);
    event BankJoined(uint256 sessionId, address bank);
    event SessionStarted(uint256 sessionId);
    event ProofPublished(uint256 sessionId, address bank);
    event SessionFinished(uint256 sessionId);

    modifier onlyInitiator(uint256 sessionId) {
        require(msg.sender == sessions[sessionId].initiator, "Not session initiator");
        _;
    }

    modifier inState(uint256 sessionId, SessionState expected) {
        require(sessions[sessionId].state == expected, "Invalid session state");
        _;
    }

    function createSession(address[] calldata invitedBanks, uint256 joinDeadline) external {
        require(invitedBanks.length > 0, "No participants");

        uint256 sessionId = sessionCount++;
        Session storage s = sessions[sessionId];
        s.initiator = msg.sender;
        s.participants = invitedBanks;
        s.joinDeadline = joinDeadline;
        s.state = SessionState.Created;

        emit SessionCreated(sessionId, msg.sender, invitedBanks);
    }

    function joinSession(uint256 sessionId) external inState(sessionId, SessionState.Created) {
        Session storage s = sessions[sessionId];

        bool isInvited = false;
        for (uint256 i = 0; i < s.participants.length; i++) {
            if (s.participants[i] == msg.sender) {
                isInvited = true;
                break;
            }
        }

        require(isInvited, "Not invited");
        require(!s.joined[msg.sender], "Already joined");

        s.joined[msg.sender] = true;
        emit BankJoined(sessionId, msg.sender);

        bool allJoined = true;
        for (uint256 i = 0; i < s.participants.length; i++) {
            if (!s.joined[s.participants[i]]) {
                allJoined = false;
                break;
            }
        }

        if (allJoined) {
            s.state = SessionState.Joined;
        }
    }

    function startSession(uint256 sessionId)
        external
        onlyInitiator(sessionId)
        inState(sessionId, SessionState.Joined)
    {
        sessions[sessionId].state = SessionState.Started;
        emit SessionStarted(sessionId);
    }

    function publishProof(
        uint256 sessionId,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata publicSignals
    ) external inState(sessionId, SessionState.Started) {
        Session storage s = sessions[sessionId];

        bool isParticipant = false;
        for (uint256 i = 0; i < s.participants.length; i++) {
            if (s.participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }

        require(isParticipant || msg.sender == s.initiator, "Not a participant");
        require(!s.proofs[msg.sender].submitted, "Proof already submitted");

        s.proofs[msg.sender] = ProofData({
            a: a,
            b: b,
            c: c,
            publicSignals: publicSignals,
            submitted: true
        });

        emit ProofPublished(sessionId, msg.sender);

        bool allSubmitted = true;
        for (uint256 i = 0; i < s.participants.length; i++) {
            if (!s.proofs[s.participants[i]].submitted) {
                allSubmitted = false;
                break;
            }
        }
        if (allSubmitted && s.proofs[s.initiator].submitted) {
            s.state = SessionState.ProofsSubmitted;
        }
    }

    function finishSession(uint256 sessionId)
        external
        onlyInitiator(sessionId)
        inState(sessionId, SessionState.ProofsSubmitted)
    {
        sessions[sessionId].state = SessionState.Finished;
        emit SessionFinished(sessionId);
    }

    function getSession(uint256 sessionId)
        external
        view
        returns (
            address initiator,
            address[] memory participants,
            SessionState state,
            uint256 joinDeadline
        )
    {
        Session storage s = sessions[sessionId];
        return (s.initiator, s.participants, s.state, s.joinDeadline);
    }

    function hasJoined(uint256 sessionId, address bank) external view returns (bool) {
        return sessions[sessionId].joined[bank];
    }

    function getProof(
        uint256 sessionId,
        address bank
    )
        external
        view
        returns (
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c,
            uint256[] memory publicSignals,
            bool submitted
        )
    {
        ProofData storage p = sessions[sessionId].proofs[bank];
        return (p.a, p.b, p.c, p.publicSignals, p.submitted);
    }
}

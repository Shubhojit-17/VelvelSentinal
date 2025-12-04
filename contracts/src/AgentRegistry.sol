// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AgentRegistry
 * @notice On-chain registry for AI agents in the Velvet Sentinel network
 * @dev Manages agent registration, attestation verification, and capability tracking
 */
contract AgentRegistry is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Roles
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant ATTESTATION_VERIFIER_ROLE = keccak256("ATTESTATION_VERIFIER_ROLE");

    // Agent status
    enum AgentStatus { Pending, Active, Suspended, Revoked }

    // Agent type
    enum AgentType { Sentinel, Arbitrage, Governance, Custom }

    // Agent registration struct
    struct Agent {
        bytes32 agentId;           // Unique agent identifier
        address owner;             // Owner wallet address
        address payable agentWallet; // Agent's derived wallet
        bytes publicKey;           // Agent's Ed25519 public key
        AgentType agentType;       // Type of agent
        AgentStatus status;        // Current status
        uint256 registeredAt;      // Registration timestamp
        uint256 lastAttestation;   // Last attestation timestamp
        bytes32 attestationHash;   // Hash of latest attestation
        string[] capabilities;     // Agent capabilities
        uint256 reputationScore;   // Reputation (0-1000)
        string metadataURI;        // IPFS URI for extended metadata
    }

    // Registered agents
    mapping(bytes32 => Agent) public agents;
    
    // Agent ID by wallet address
    mapping(address => bytes32) public agentIdByWallet;
    
    // Agent IDs by owner
    mapping(address => bytes32[]) public agentsByOwner;
    
    // All registered agent IDs
    bytes32[] public allAgentIds;

    // Attestation expiry (24 hours)
    uint256 public constant ATTESTATION_EXPIRY = 86400;

    // Minimum reputation for syndicate eligibility
    uint256 public constant MIN_SYNDICATE_REPUTATION = 300;

    // Events
    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed owner,
        address agentWallet,
        AgentType agentType
    );
    event AgentStatusUpdated(bytes32 indexed agentId, AgentStatus status);
    event AttestationUpdated(bytes32 indexed agentId, bytes32 attestationHash);
    event ReputationUpdated(bytes32 indexed agentId, uint256 newScore);
    event CapabilityAdded(bytes32 indexed agentId, string capability);
    event CapabilityRemoved(bytes32 indexed agentId, string capability);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(ATTESTATION_VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Register a new agent
     * @param agentId Unique agent identifier
     * @param agentWallet Agent's derived wallet address
     * @param publicKey Agent's Ed25519 public key
     * @param agentType Type of agent
     * @param capabilities Initial capabilities
     * @param metadataURI IPFS URI for metadata
     */
    function registerAgent(
        bytes32 agentId,
        address payable agentWallet,
        bytes calldata publicKey,
        AgentType agentType,
        string[] calldata capabilities,
        string calldata metadataURI
    ) external nonReentrant {
        require(agents[agentId].registeredAt == 0, "Agent already registered");
        require(agentIdByWallet[agentWallet] == bytes32(0), "Wallet already used");
        require(publicKey.length == 32, "Invalid public key length");

        Agent storage agent = agents[agentId];
        agent.agentId = agentId;
        agent.owner = msg.sender;
        agent.agentWallet = agentWallet;
        agent.publicKey = publicKey;
        agent.agentType = agentType;
        agent.status = AgentStatus.Pending;
        agent.registeredAt = block.timestamp;
        agent.lastAttestation = 0;
        agent.attestationHash = bytes32(0);
        agent.capabilities = capabilities;
        agent.reputationScore = 100; // Starting reputation
        agent.metadataURI = metadataURI;

        agentIdByWallet[agentWallet] = agentId;
        agentsByOwner[msg.sender].push(agentId);
        allAgentIds.push(agentId);

        emit AgentRegistered(agentId, msg.sender, agentWallet, agentType);
    }

    /**
     * @notice Verify and store TEE attestation
     * @param agentId Agent identifier
     * @param attestationHash Hash of the attestation data
     * @param signature Signature from attestation verifier
     */
    function verifyAttestation(
        bytes32 agentId,
        bytes32 attestationHash,
        bytes calldata signature
    ) external onlyRole(ATTESTATION_VERIFIER_ROLE) {
        Agent storage agent = agents[agentId];
        require(agent.registeredAt > 0, "Agent not registered");

        // Verify signature (simplified - production would verify against TEE)
        bytes32 messageHash = keccak256(abi.encodePacked(agentId, attestationHash));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(hasRole(ATTESTATION_VERIFIER_ROLE, signer), "Invalid signature");

        agent.attestationHash = attestationHash;
        agent.lastAttestation = block.timestamp;
        
        // Activate if pending
        if (agent.status == AgentStatus.Pending) {
            agent.status = AgentStatus.Active;
            emit AgentStatusUpdated(agentId, AgentStatus.Active);
        }

        emit AttestationUpdated(agentId, attestationHash);
    }

    /**
     * @notice Update agent status
     * @param agentId Agent identifier
     * @param status New status
     */
    function updateStatus(
        bytes32 agentId,
        AgentStatus status
    ) external {
        Agent storage agent = agents[agentId];
        require(agent.registeredAt > 0, "Agent not registered");
        require(
            msg.sender == agent.owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        agent.status = status;
        emit AgentStatusUpdated(agentId, status);
    }

    /**
     * @notice Update agent reputation
     * @param agentId Agent identifier
     * @param delta Reputation change (positive or negative)
     */
    function updateReputation(
        bytes32 agentId,
        int256 delta
    ) external onlyRole(REGISTRAR_ROLE) {
        Agent storage agent = agents[agentId];
        require(agent.registeredAt > 0, "Agent not registered");

        int256 newScore = int256(agent.reputationScore) + delta;
        if (newScore < 0) newScore = 0;
        if (newScore > 1000) newScore = 1000;
        
        agent.reputationScore = uint256(newScore);
        emit ReputationUpdated(agentId, agent.reputationScore);
    }

    /**
     * @notice Add capability to agent
     * @param agentId Agent identifier
     * @param capability Capability to add
     */
    function addCapability(
        bytes32 agentId,
        string calldata capability
    ) external {
        Agent storage agent = agents[agentId];
        require(agent.registeredAt > 0, "Agent not registered");
        require(msg.sender == agent.owner, "Not owner");

        agent.capabilities.push(capability);
        emit CapabilityAdded(agentId, capability);
    }

    /**
     * @notice Check if agent attestation is valid
     * @param agentId Agent identifier
     */
    function isAttestationValid(bytes32 agentId) public view returns (bool) {
        Agent storage agent = agents[agentId];
        if (agent.lastAttestation == 0) return false;
        return block.timestamp - agent.lastAttestation < ATTESTATION_EXPIRY;
    }

    /**
     * @notice Check if agent is eligible for syndicate
     * @param agentId Agent identifier
     */
    function isSyndicateEligible(bytes32 agentId) public view returns (bool) {
        Agent storage agent = agents[agentId];
        return agent.status == AgentStatus.Active
            && agent.reputationScore >= MIN_SYNDICATE_REPUTATION
            && isAttestationValid(agentId);
    }

    /**
     * @notice Get agent info
     * @param agentId Agent identifier
     */
    function getAgent(bytes32 agentId) external view returns (
        address owner,
        address agentWallet,
        AgentType agentType,
        AgentStatus status,
        uint256 registeredAt,
        uint256 reputationScore,
        bool attestationValid
    ) {
        Agent storage agent = agents[agentId];
        return (
            agent.owner,
            agent.agentWallet,
            agent.agentType,
            agent.status,
            agent.registeredAt,
            agent.reputationScore,
            isAttestationValid(agentId)
        );
    }

    /**
     * @notice Get agent capabilities
     * @param agentId Agent identifier
     */
    function getCapabilities(bytes32 agentId) external view returns (string[] memory) {
        return agents[agentId].capabilities;
    }

    /**
     * @notice Get agents by owner
     * @param owner Owner address
     */
    function getAgentsByOwner(address owner) external view returns (bytes32[] memory) {
        return agentsByOwner[owner];
    }

    /**
     * @notice Get total registered agents
     */
    function totalAgents() external view returns (uint256) {
        return allAgentIds.length;
    }

    /**
     * @notice Get active agent count
     */
    function activeAgentCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allAgentIds.length; i++) {
            if (agents[allAgentIds[i]].status == AgentStatus.Active) {
                count++;
            }
        }
        return count;
    }
}

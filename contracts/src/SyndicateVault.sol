// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";

/**
 * @title SyndicateVault
 * @notice Manages funds and coordination for agent syndicates
 * @dev Handles deposits, withdrawals, profit distribution, and governance
 */
contract SyndicateVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant SYNDICATE_ADMIN_ROLE = keccak256("SYNDICATE_ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // Reference to agent registry
    AgentRegistry public immutable agentRegistry;

    // Syndicate configuration
    struct SyndicateConfig {
        bytes32 syndicateId;
        string name;
        address founder;
        uint256 minReputation;          // Minimum reputation to join
        uint256 maxMembers;             // Maximum members
        uint256 votingThresholdBps;     // Voting threshold (basis points)
        uint256 proposalDuration;       // Proposal duration in seconds
        uint256 syndicateFeeBps;        // Fee for syndicate treasury
        bool requiresProof;             // Requires ZK performance proof
        bool active;
    }

    // Member info
    struct Member {
        bytes32 agentId;
        uint256 joinedAt;
        uint256 votingPower;
        uint256 contribution;
        bool active;
    }

    // Proposal types
    enum ProposalType {
        AddMember,
        RemoveMember,
        UpdateConfig,
        ExecuteTrade,
        DistributeProfits,
        Custom
    }

    // Proposal struct
    struct Proposal {
        bytes32 proposalId;
        ProposalType proposalType;
        bytes32 targetAgentId;          // For member proposals
        bytes data;                      // Encoded proposal data
        address proposer;
        uint256 createdAt;
        uint256 deadline;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        bool cancelled;
    }

    // Syndicates
    mapping(bytes32 => SyndicateConfig) public syndicates;
    
    // Members: syndicateId => agentId => Member
    mapping(bytes32 => mapping(bytes32 => Member)) public members;
    
    // Member list: syndicateId => agentIds
    mapping(bytes32 => bytes32[]) public memberList;

    // Proposals: syndicateId => proposalId => Proposal
    mapping(bytes32 => mapping(bytes32 => Proposal)) public proposals;
    
    // Votes: proposalId => agentId => voted
    mapping(bytes32 => mapping(bytes32 => bool)) public hasVoted;

    // Treasury: syndicateId => token => amount
    mapping(bytes32 => mapping(address => uint256)) public treasury;

    // Native ETH treasury
    mapping(bytes32 => uint256) public ethTreasury;

    // Proposal counter per syndicate
    mapping(bytes32 => uint256) public proposalCounter;

    // All syndicate IDs
    bytes32[] public allSyndicateIds;

    // Events
    event SyndicateCreated(bytes32 indexed syndicateId, string name, address founder);
    event MemberJoined(bytes32 indexed syndicateId, bytes32 indexed agentId);
    event MemberLeft(bytes32 indexed syndicateId, bytes32 indexed agentId);
    event ProposalCreated(bytes32 indexed syndicateId, bytes32 indexed proposalId, ProposalType proposalType);
    event Voted(bytes32 indexed proposalId, bytes32 indexed agentId, bool approve);
    event ProposalExecuted(bytes32 indexed syndicateId, bytes32 indexed proposalId, bool success);
    event DepositReceived(bytes32 indexed syndicateId, address token, uint256 amount);
    event Withdrawal(bytes32 indexed syndicateId, address token, address to, uint256 amount);
    event ProfitsDistributed(bytes32 indexed syndicateId, uint256 totalAmount);

    constructor(address _agentRegistry) {
        agentRegistry = AgentRegistry(_agentRegistry);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SYNDICATE_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create a new syndicate
     * @param syndicateId Unique syndicate identifier
     * @param name Syndicate name
     * @param minReputation Minimum reputation to join
     * @param maxMembers Maximum members allowed
     * @param votingThresholdBps Voting threshold in basis points
     * @param proposalDuration Duration of proposals in seconds
     * @param syndicateFeeBps Syndicate fee in basis points
     * @param requiresProof Whether ZK proof is required
     */
    function createSyndicate(
        bytes32 syndicateId,
        string calldata name,
        uint256 minReputation,
        uint256 maxMembers,
        uint256 votingThresholdBps,
        uint256 proposalDuration,
        uint256 syndicateFeeBps,
        bool requiresProof
    ) external nonReentrant {
        require(syndicates[syndicateId].founder == address(0), "Syndicate exists");
        require(votingThresholdBps <= 10000, "Invalid threshold");
        require(syndicateFeeBps <= 5000, "Fee too high"); // Max 50%
        require(proposalDuration >= 3600, "Duration too short"); // Min 1 hour

        syndicates[syndicateId] = SyndicateConfig({
            syndicateId: syndicateId,
            name: name,
            founder: msg.sender,
            minReputation: minReputation,
            maxMembers: maxMembers,
            votingThresholdBps: votingThresholdBps,
            proposalDuration: proposalDuration,
            syndicateFeeBps: syndicateFeeBps,
            requiresProof: requiresProof,
            active: true
        });

        allSyndicateIds.push(syndicateId);
        emit SyndicateCreated(syndicateId, name, msg.sender);
    }

    /**
     * @notice Request to join a syndicate (creates proposal)
     * @param syndicateId Syndicate to join
     * @param agentId Joining agent's ID
     */
    function requestMembership(
        bytes32 syndicateId,
        bytes32 agentId
    ) external nonReentrant returns (bytes32 proposalId) {
        SyndicateConfig storage syndicate = syndicates[syndicateId];
        require(syndicate.active, "Syndicate not active");
        require(members[syndicateId][agentId].joinedAt == 0, "Already member");
        require(memberList[syndicateId].length < syndicate.maxMembers, "Syndicate full");

        // Verify agent eligibility
        require(agentRegistry.isSyndicateEligible(agentId), "Not eligible");
        
        // Get agent info and verify reputation
        (address owner, , , , , uint256 reputation, ) = agentRegistry.getAgent(agentId);
        require(msg.sender == owner, "Not agent owner");
        require(reputation >= syndicate.minReputation, "Reputation too low");

        // Create add member proposal
        return _createProposal(
            syndicateId,
            ProposalType.AddMember,
            agentId,
            ""
        );
    }

    /**
     * @notice Add member directly (for founder's first member or approved proposals)
     */
    function addMember(
        bytes32 syndicateId,
        bytes32 agentId,
        uint256 votingPower
    ) external {
        SyndicateConfig storage syndicate = syndicates[syndicateId];
        require(
            msg.sender == syndicate.founder || hasRole(EXECUTOR_ROLE, msg.sender),
            "Not authorized"
        );
        require(members[syndicateId][agentId].joinedAt == 0, "Already member");

        _addMember(syndicateId, agentId, votingPower);
    }

    function _addMember(
        bytes32 syndicateId,
        bytes32 agentId,
        uint256 votingPower
    ) internal {
        members[syndicateId][agentId] = Member({
            agentId: agentId,
            joinedAt: block.timestamp,
            votingPower: votingPower,
            contribution: 0,
            active: true
        });

        memberList[syndicateId].push(agentId);
        emit MemberJoined(syndicateId, agentId);
    }

    /**
     * @notice Vote on a proposal
     * @param syndicateId Syndicate ID
     * @param proposalId Proposal ID
     * @param agentId Voting agent ID
     * @param approve Vote yes or no
     */
    function vote(
        bytes32 syndicateId,
        bytes32 proposalId,
        bytes32 agentId,
        bool approve
    ) external nonReentrant {
        Member storage member = members[syndicateId][agentId];
        require(member.active, "Not active member");
        
        // Verify caller is agent owner
        (address owner, , , , , , ) = agentRegistry.getAgent(agentId);
        require(msg.sender == owner, "Not agent owner");

        Proposal storage proposal = proposals[syndicateId][proposalId];
        require(proposal.createdAt > 0, "Proposal not found");
        require(block.timestamp <= proposal.deadline, "Voting closed");
        require(!hasVoted[proposalId][agentId], "Already voted");

        hasVoted[proposalId][agentId] = true;

        if (approve) {
            proposal.votesFor += member.votingPower;
        } else {
            proposal.votesAgainst += member.votingPower;
        }

        emit Voted(proposalId, agentId, approve);
    }

    /**
     * @notice Execute a passed proposal
     * @param syndicateId Syndicate ID
     * @param proposalId Proposal ID
     */
    function executeProposal(
        bytes32 syndicateId,
        bytes32 proposalId
    ) external nonReentrant {
        Proposal storage proposal = proposals[syndicateId][proposalId];
        require(proposal.createdAt > 0, "Proposal not found");
        require(block.timestamp > proposal.deadline, "Voting still open");
        require(!proposal.executed && !proposal.cancelled, "Already finalized");

        SyndicateConfig storage syndicate = syndicates[syndicateId];
        
        // Check if passed
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 threshold = (totalVotes * syndicate.votingThresholdBps) / 10000;
        bool passed = proposal.votesFor >= threshold;

        proposal.executed = true;

        if (passed) {
            _executeProposalAction(syndicateId, proposal);
        }

        emit ProposalExecuted(syndicateId, proposalId, passed);
    }

    function _executeProposalAction(
        bytes32 syndicateId,
        Proposal storage proposal
    ) internal {
        if (proposal.proposalType == ProposalType.AddMember) {
            // Get reputation as voting power
            (, , , , , uint256 reputation, ) = agentRegistry.getAgent(proposal.targetAgentId);
            _addMember(syndicateId, proposal.targetAgentId, reputation);
        } else if (proposal.proposalType == ProposalType.RemoveMember) {
            members[syndicateId][proposal.targetAgentId].active = false;
            emit MemberLeft(syndicateId, proposal.targetAgentId);
        }
        // Other proposal types would be implemented here
    }

    /**
     * @notice Deposit ERC20 tokens to syndicate treasury
     * @param syndicateId Syndicate ID
     * @param token Token address
     * @param amount Amount to deposit
     */
    function depositToken(
        bytes32 syndicateId,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(syndicates[syndicateId].active, "Syndicate not active");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        treasury[syndicateId][token] += amount;
        
        emit DepositReceived(syndicateId, token, amount);
    }

    /**
     * @notice Deposit ETH to syndicate treasury
     * @param syndicateId Syndicate ID
     */
    function depositETH(bytes32 syndicateId) external payable nonReentrant {
        require(syndicates[syndicateId].active, "Syndicate not active");
        require(msg.value > 0, "No value sent");
        
        ethTreasury[syndicateId] += msg.value;
        emit DepositReceived(syndicateId, address(0), msg.value);
    }

    /**
     * @notice Withdraw from syndicate treasury (requires executor role)
     * @param syndicateId Syndicate ID
     * @param token Token address (address(0) for ETH)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdraw(
        bytes32 syndicateId,
        address token,
        address payable to,
        uint256 amount
    ) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        if (token == address(0)) {
            require(ethTreasury[syndicateId] >= amount, "Insufficient ETH");
            ethTreasury[syndicateId] -= amount;
            to.transfer(amount);
        } else {
            require(treasury[syndicateId][token] >= amount, "Insufficient balance");
            treasury[syndicateId][token] -= amount;
            IERC20(token).safeTransfer(to, amount);
        }
        
        emit Withdrawal(syndicateId, token, to, amount);
    }

    /**
     * @notice Distribute profits to members
     * @param syndicateId Syndicate ID
     * @param token Token to distribute (address(0) for ETH)
     * @param amount Total amount to distribute
     */
    function distributeProfits(
        bytes32 syndicateId,
        address token,
        uint256 amount
    ) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        SyndicateConfig storage syndicate = syndicates[syndicateId];
        
        // Calculate syndicate fee
        uint256 fee = (amount * syndicate.syndicateFeeBps) / 10000;
        uint256 distributable = amount - fee;

        // Calculate total voting power
        uint256 totalPower = 0;
        bytes32[] memory memberIds = memberList[syndicateId];
        for (uint256 i = 0; i < memberIds.length; i++) {
            Member storage m = members[syndicateId][memberIds[i]];
            if (m.active) {
                totalPower += m.votingPower;
            }
        }

        require(totalPower > 0, "No active members");

        // Distribute to each member
        for (uint256 i = 0; i < memberIds.length; i++) {
            Member storage m = members[syndicateId][memberIds[i]];
            if (m.active) {
                uint256 share = (distributable * m.votingPower) / totalPower;
                (address owner, , , , , , ) = agentRegistry.getAgent(m.agentId);
                
                if (token == address(0)) {
                    ethTreasury[syndicateId] -= share;
                    payable(owner).transfer(share);
                } else {
                    treasury[syndicateId][token] -= share;
                    IERC20(token).safeTransfer(owner, share);
                }
            }
        }

        emit ProfitsDistributed(syndicateId, distributable);
    }

    function _createProposal(
        bytes32 syndicateId,
        ProposalType proposalType,
        bytes32 targetAgentId,
        bytes memory data
    ) internal returns (bytes32) {
        proposalCounter[syndicateId]++;
        bytes32 proposalId = keccak256(abi.encodePacked(syndicateId, proposalCounter[syndicateId]));

        SyndicateConfig storage syndicate = syndicates[syndicateId];

        proposals[syndicateId][proposalId] = Proposal({
            proposalId: proposalId,
            proposalType: proposalType,
            targetAgentId: targetAgentId,
            data: data,
            proposer: msg.sender,
            createdAt: block.timestamp,
            deadline: block.timestamp + syndicate.proposalDuration,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(syndicateId, proposalId, proposalType);
        return proposalId;
    }

    /**
     * @notice Get member count for syndicate
     */
    function getMemberCount(bytes32 syndicateId) external view returns (uint256) {
        return memberList[syndicateId].length;
    }

    /**
     * @notice Get total syndicates
     */
    function totalSyndicates() external view returns (uint256) {
        return allSyndicateIds.length;
    }

    /**
     * @notice Get treasury balance
     */
    function getTreasuryBalance(
        bytes32 syndicateId,
        address token
    ) external view returns (uint256) {
        if (token == address(0)) {
            return ethTreasury[syndicateId];
        }
        return treasury[syndicateId][token];
    }

    // Receive ETH
    receive() external payable {}
}

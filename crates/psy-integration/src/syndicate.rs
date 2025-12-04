//! Syndicate Management for Psy Protocol
//!
//! Manages agent syndicates, membership, and governance.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use sdkey_manager::DelegationChain;
use zk_proofs::PerformanceProof;

/// Syndicate configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyndicateConfig {
    /// Syndicate unique ID
    pub id: String,
    /// Syndicate name
    pub name: String,
    /// Description
    pub description: String,
    /// Minimum reputation score to join (0-1000)
    pub min_reputation: u32,
    /// Minimum performance proof required
    pub requires_performance_proof: bool,
    /// Minimum PnL in basis points for membership
    pub min_pnl_bps: i64,
    /// Maximum members
    pub max_members: usize,
    /// Voting threshold for proposals (basis points, e.g., 5000 = 50%)
    pub voting_threshold_bps: u32,
    /// Proposal duration in seconds
    pub proposal_duration: u64,
    /// Profit share for syndicate (basis points)
    pub syndicate_fee_bps: u32,
    /// Treasury address
    pub treasury_address: Option<String>,
}

impl Default for SyndicateConfig {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: "Default Syndicate".into(),
            description: String::new(),
            min_reputation: 300,
            requires_performance_proof: true,
            min_pnl_bps: 0,
            max_members: 100,
            voting_threshold_bps: 5000, // 50%
            proposal_duration: 86_400,   // 24 hours
            syndicate_fee_bps: 500,      // 5%
            treasury_address: None,
        }
    }
}

/// Syndicate member
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyndicateMember {
    /// Agent ID
    pub agent_id: String,
    /// Join timestamp
    pub joined_at: u64,
    /// Current reputation in syndicate
    pub reputation: u32,
    /// Total contribution score
    pub contribution_score: u64,
    /// Performance proof (if any)
    pub performance_proof: Option<String>, // Proof ID
    /// Role in syndicate
    pub role: MemberRole,
    /// Voting power (calculated from reputation + contribution)
    pub voting_power: u32,
    /// Is active
    pub active: bool,
}

/// Member role
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MemberRole {
    /// Regular member
    Member,
    /// Can approve new members
    Approver,
    /// Full admin rights
    Admin,
    /// Syndicate founder
    Founder,
}

impl MemberRole {
    pub fn can_approve_members(&self) -> bool {
        matches!(self, Self::Approver | Self::Admin | Self::Founder)
    }

    pub fn can_create_proposals(&self) -> bool {
        matches!(self, Self::Admin | Self::Founder)
    }

    pub fn can_modify_config(&self) -> bool {
        matches!(self, Self::Founder)
    }
}

/// Proposal type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProposalType {
    /// Add a new member
    AddMember { agent_id: String },
    /// Remove a member
    RemoveMember { agent_id: String },
    /// Update syndicate config
    UpdateConfig { field: String, value: String },
    /// Execute a trade/action
    ExecuteAction { action_type: String, params: HashMap<String, String> },
    /// Distribute profits
    DistributeProfits { amount: u64 },
    /// Custom proposal
    Custom { title: String, description: String },
}

/// A governance proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
    /// Proposal ID
    pub id: String,
    /// Proposal type
    pub proposal_type: ProposalType,
    /// Proposer agent ID
    pub proposer: String,
    /// Creation timestamp
    pub created_at: u64,
    /// Voting deadline
    pub deadline: u64,
    /// For votes (voting power)
    pub votes_for: u64,
    /// Against votes (voting power)
    pub votes_against: u64,
    /// Voters (agent_id -> vote)
    pub voters: HashMap<String, bool>,
    /// Status
    pub status: ProposalStatus,
    /// Execution result (if executed)
    pub execution_result: Option<String>,
}

/// Proposal status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    Executed,
    Cancelled,
}

/// Agent Syndicate
pub struct Syndicate {
    /// Configuration
    config: SyndicateConfig,
    /// Members
    members: HashMap<String, SyndicateMember>,
    /// Active proposals
    proposals: HashMap<String, Proposal>,
    /// Delegation chains
    delegations: HashMap<String, DelegationChain>,
    /// Proposal counter
    proposal_counter: u64,
}

impl Syndicate {
    /// Create new syndicate
    pub fn new(config: SyndicateConfig) -> Self {
        Self {
            config,
            members: HashMap::new(),
            proposals: HashMap::new(),
            delegations: HashMap::new(),
            proposal_counter: 0,
        }
    }

    /// Get syndicate ID
    pub fn id(&self) -> &str {
        &self.config.id
    }

    /// Get config
    pub fn config(&self) -> &SyndicateConfig {
        &self.config
    }

    /// Add founding member
    pub fn add_founder(&mut self, agent_id: String) -> Result<(), SyndicateError> {
        if !self.members.is_empty() {
            return Err(SyndicateError::FounderAlreadySet);
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let member = SyndicateMember {
            agent_id: agent_id.clone(),
            joined_at: now,
            reputation: 1000, // Max reputation for founder
            contribution_score: 0,
            performance_proof: None,
            role: MemberRole::Founder,
            voting_power: 1000,
            active: true,
        };

        self.members.insert(agent_id, member);
        Ok(())
    }

    /// Request to join syndicate
    pub fn request_membership(
        &mut self,
        agent_id: String,
        reputation: u32,
        proof: Option<&PerformanceProof>,
    ) -> Result<String, SyndicateError> {
        // Check if already member
        if self.members.contains_key(&agent_id) {
            return Err(SyndicateError::AlreadyMember(agent_id));
        }

        // Check member limit
        if self.members.len() >= self.config.max_members {
            return Err(SyndicateError::MemberLimitReached);
        }

        // Check reputation
        if reputation < self.config.min_reputation {
            return Err(SyndicateError::InsufficientReputation {
                required: self.config.min_reputation,
                actual: reputation,
            });
        }

        // Check performance proof if required
        if self.config.requires_performance_proof && proof.is_none() {
            return Err(SyndicateError::ProofRequired);
        }

        // Create add member proposal
        let proposal = self.create_proposal(
            "system".into(),
            ProposalType::AddMember { agent_id: agent_id.clone() },
        )?;

        Ok(proposal.id.clone())
    }

    /// Add member (after approval)
    pub fn add_member(&mut self, agent_id: String, reputation: u32) -> Result<(), SyndicateError> {
        if self.members.contains_key(&agent_id) {
            return Err(SyndicateError::AlreadyMember(agent_id));
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let member = SyndicateMember {
            agent_id: agent_id.clone(),
            joined_at: now,
            reputation,
            contribution_score: 0,
            performance_proof: None,
            role: MemberRole::Member,
            voting_power: reputation,
            active: true,
        };

        self.members.insert(agent_id, member);
        Ok(())
    }

    /// Create a proposal
    pub fn create_proposal(
        &mut self,
        proposer: String,
        proposal_type: ProposalType,
    ) -> Result<&Proposal, SyndicateError> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.proposal_counter += 1;
        let proposal_id = format!("{}-{}", self.config.id, self.proposal_counter);

        let proposal = Proposal {
            id: proposal_id.clone(),
            proposal_type,
            proposer,
            created_at: now,
            deadline: now + self.config.proposal_duration,
            votes_for: 0,
            votes_against: 0,
            voters: HashMap::new(),
            status: ProposalStatus::Active,
            execution_result: None,
        };

        self.proposals.insert(proposal_id.clone(), proposal);
        Ok(self.proposals.get(&proposal_id).unwrap())
    }

    /// Vote on a proposal
    pub fn vote(
        &mut self,
        proposal_id: &str,
        voter: &str,
        approve: bool,
    ) -> Result<(), SyndicateError> {
        // Get voter info
        let member = self.members.get(voter)
            .ok_or_else(|| SyndicateError::NotMember(voter.to_string()))?;

        if !member.active {
            return Err(SyndicateError::MemberInactive);
        }

        let voting_power = member.voting_power as u64;

        // Get proposal
        let proposal = self.proposals.get_mut(proposal_id)
            .ok_or_else(|| SyndicateError::ProposalNotFound(proposal_id.to_string()))?;

        // Check if voting is still open
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if now > proposal.deadline {
            return Err(SyndicateError::VotingClosed);
        }

        // Check if already voted
        if proposal.voters.contains_key(voter) {
            return Err(SyndicateError::AlreadyVoted);
        }

        // Record vote
        proposal.voters.insert(voter.to_string(), approve);
        if approve {
            proposal.votes_for += voting_power;
        } else {
            proposal.votes_against += voting_power;
        }

        Ok(())
    }

    /// Finalize a proposal
    pub fn finalize_proposal(&mut self, proposal_id: &str) -> Result<ProposalStatus, SyndicateError> {
        let proposal = self.proposals.get_mut(proposal_id)
            .ok_or_else(|| SyndicateError::ProposalNotFound(proposal_id.to_string()))?;

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if now <= proposal.deadline && proposal.status == ProposalStatus::Active {
            return Err(SyndicateError::VotingStillOpen);
        }

        let total_votes = proposal.votes_for + proposal.votes_against;
        let total_voting_power: u64 = self.members.values()
            .filter(|m| m.active)
            .map(|m| m.voting_power as u64)
            .sum();

        // Check quorum (at least 20% participation)
        let quorum_threshold = total_voting_power / 5;
        if total_votes < quorum_threshold {
            proposal.status = ProposalStatus::Rejected;
            return Ok(ProposalStatus::Rejected);
        }

        // Check if passed
        let threshold = (total_votes * self.config.voting_threshold_bps as u64) / 10000;
        if proposal.votes_for >= threshold {
            proposal.status = ProposalStatus::Passed;
            Ok(ProposalStatus::Passed)
        } else {
            proposal.status = ProposalStatus::Rejected;
            Ok(ProposalStatus::Rejected)
        }
    }

    /// Get member count
    pub fn member_count(&self) -> usize {
        self.members.len()
    }

    /// Get active members
    pub fn active_members(&self) -> Vec<&SyndicateMember> {
        self.members.values().filter(|m| m.active).collect()
    }

    /// Get member by ID
    pub fn get_member(&self, agent_id: &str) -> Option<&SyndicateMember> {
        self.members.get(agent_id)
    }

    /// Get proposal by ID
    pub fn get_proposal(&self, proposal_id: &str) -> Option<&Proposal> {
        self.proposals.get(proposal_id)
    }

    /// List active proposals
    pub fn active_proposals(&self) -> Vec<&Proposal> {
        self.proposals.values()
            .filter(|p| p.status == ProposalStatus::Active)
            .collect()
    }

    /// Update member reputation
    pub fn update_reputation(
        &mut self,
        agent_id: &str,
        delta: i32,
    ) -> Result<u32, SyndicateError> {
        let member = self.members.get_mut(agent_id)
            .ok_or_else(|| SyndicateError::NotMember(agent_id.to_string()))?;

        let new_rep = (member.reputation as i32 + delta).clamp(0, 1000) as u32;
        member.reputation = new_rep;
        member.voting_power = new_rep;

        Ok(new_rep)
    }

    /// Record contribution
    pub fn record_contribution(
        &mut self,
        agent_id: &str,
        amount: u64,
    ) -> Result<(), SyndicateError> {
        let member = self.members.get_mut(agent_id)
            .ok_or_else(|| SyndicateError::NotMember(agent_id.to_string()))?;

        member.contribution_score += amount;
        Ok(())
    }

    /// Set delegation chain for agent
    pub fn set_delegation(&mut self, agent_id: String, chain: DelegationChain) {
        self.delegations.insert(agent_id, chain);
    }

    /// Get delegation chain
    pub fn get_delegation(&self, agent_id: &str) -> Option<&DelegationChain> {
        self.delegations.get(agent_id)
    }
}

/// Syndicate errors
#[derive(Debug, Clone, thiserror::Error)]
pub enum SyndicateError {
    #[error("Agent is already a member: {0}")]
    AlreadyMember(String),

    #[error("Agent is not a member: {0}")]
    NotMember(String),

    #[error("Member is inactive")]
    MemberInactive,

    #[error("Member limit reached")]
    MemberLimitReached,

    #[error("Insufficient reputation: required {required}, actual {actual}")]
    InsufficientReputation { required: u32, actual: u32 },

    #[error("Performance proof required")]
    ProofRequired,

    #[error("Proposal not found: {0}")]
    ProposalNotFound(String),

    #[error("Voting is closed")]
    VotingClosed,

    #[error("Voting is still open")]
    VotingStillOpen,

    #[error("Already voted on this proposal")]
    AlreadyVoted,

    #[error("Founder already set")]
    FounderAlreadySet,

    #[error("Permission denied")]
    PermissionDenied,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_syndicate_creation() {
        let config = SyndicateConfig {
            id: "syndicate-001".into(),
            name: "Test Syndicate".into(),
            ..Default::default()
        };

        let mut syndicate = Syndicate::new(config);
        syndicate.add_founder("founder-agent".into()).unwrap();

        assert_eq!(syndicate.member_count(), 1);
        
        let founder = syndicate.get_member("founder-agent").unwrap();
        assert_eq!(founder.role, MemberRole::Founder);
    }

    #[test]
    fn test_voting() {
        let config = SyndicateConfig {
            id: "syndicate-001".into(),
            proposal_duration: 1, // 1 second for testing
            ..Default::default()
        };

        let mut syndicate = Syndicate::new(config);
        syndicate.add_founder("founder".into()).unwrap();
        syndicate.add_member("member1".into(), 500).unwrap();
        syndicate.add_member("member2".into(), 500).unwrap();

        // Create proposal
        let proposal = syndicate.create_proposal(
            "founder".into(),
            ProposalType::Custom {
                title: "Test".into(),
                description: "Test proposal".into(),
            },
        ).unwrap();
        let proposal_id = proposal.id.clone();

        // Vote
        syndicate.vote(&proposal_id, "founder", true).unwrap();
        syndicate.vote(&proposal_id, "member1", true).unwrap();
        syndicate.vote(&proposal_id, "member2", false).unwrap();

        // Wait for deadline
        std::thread::sleep(std::time::Duration::from_secs(2));

        // Finalize
        let status = syndicate.finalize_proposal(&proposal_id).unwrap();
        assert_eq!(status, ProposalStatus::Passed); // 1500 for vs 500 against
    }
}

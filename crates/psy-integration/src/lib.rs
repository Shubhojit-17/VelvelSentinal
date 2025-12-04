//! Psy Integration - Full Psy Protocol Integration
//!
//! Provides integration with Psy Protocol for agent syndicate management,
//! reputation systems, and decentralized coordination.

mod registry;
mod syndicate;
mod reputation;

pub use registry::{AgentRegistry, AgentRegistration, RegistrationStatus};
pub use syndicate::{Syndicate, SyndicateMember, SyndicateConfig, ProposalType, Proposal};
pub use reputation::{ReputationTracker, ReputationLevel, ReputationEvent};

/// Re-export sdkey-manager types
pub use sdkey_manager::{AgentSDKey, AgentPermissions, DelegationChain, PermissionLevel};

/// Re-export zk-proofs types
pub use zk_proofs::{PerformanceMetrics, PerformanceProof, ProofVerifier};

/// Prelude for common imports
pub mod prelude {
    pub use crate::{
        AgentRegistry, AgentRegistration, RegistrationStatus,
        Syndicate, SyndicateMember, SyndicateConfig, ProposalType, Proposal,
        ReputationTracker, ReputationLevel, ReputationEvent,
        AgentSDKey, AgentPermissions, DelegationChain, PermissionLevel,
        PerformanceMetrics, PerformanceProof, ProofVerifier,
    };
}

//! SDKey Manager - Psy Protocol Identity Management
//!
//! Implements SDKey (Self-Describing Key) identity system for AI agents
//! based on Psy Protocol specifications.

mod permissions;
mod sdkey;
mod delegation;

pub use permissions::{AgentPermissions, PermissionLevel, TradingRestrictions};
pub use sdkey::{AgentSDKey, AgentMetadata, PublicAgentIdentity, SDKeyError, SDKeyId};
pub use delegation::{Delegation, DelegationChain, DelegationError};

/// Re-export common types
pub mod prelude {
    pub use crate::{
        AgentPermissions, AgentSDKey, AgentMetadata, Delegation, DelegationChain,
        PermissionLevel, PublicAgentIdentity, SDKeyError, SDKeyId, TradingRestrictions,
    };
}

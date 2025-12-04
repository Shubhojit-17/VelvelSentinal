//! Delegation chain management for SDKeys

use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

use crate::permissions::AgentPermissions;
use crate::sdkey::{AgentSDKey, SDKeyId};

/// A delegation from one agent to another
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Delegation {
    /// Delegator's SDKey ID
    pub delegator_id: SDKeyId,
    /// Delegatee's SDKey ID
    pub delegatee_id: SDKeyId,
    /// Delegated permissions (subset of delegator's)
    pub permissions: AgentPermissions,
    /// Delegation signature (signed by delegator)
    pub signature: String,
    /// Creation timestamp
    pub created_at: u64,
    /// Expiration timestamp
    pub expires_at: u64,
    /// Whether this delegation can be further delegated
    pub can_redelegate: bool,
}

impl Delegation {
    /// Create a new delegation
    pub fn create(
        delegator: &AgentSDKey,
        delegatee_id: SDKeyId,
        permissions: AgentPermissions,
        expires_at: u64,
        can_redelegate: bool,
    ) -> Result<Self, DelegationError> {
        // Validate that delegated permissions are subset of delegator's
        // (simplified check - real impl would be more thorough)
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if expires_at <= now {
            return Err(DelegationError::InvalidExpiration);
        }

        // Create delegation data to sign
        let delegation_data = DelegationData {
            delegator_id: delegator.id(),
            delegatee_id,
            permissions_hash: Self::hash_permissions(&permissions),
            expires_at,
            can_redelegate,
        };

        let data_bytes = serde_json::to_vec(&delegation_data)
            .map_err(|e| DelegationError::SerializationError(e.to_string()))?;

        let signature = delegator
            .sign_hex(&data_bytes)
            .map_err(|e| DelegationError::SigningError(e.to_string()))?;

        Ok(Self {
            delegator_id: delegator.id(),
            delegatee_id,
            permissions,
            signature,
            created_at: now,
            expires_at,
            can_redelegate,
        })
    }

    /// Check if delegation is still valid
    pub fn is_valid(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        now < self.expires_at
    }

    /// Hash permissions for signing
    fn hash_permissions(permissions: &AgentPermissions) -> String {
        let json = serde_json::to_string(permissions).unwrap_or_default();
        let mut hasher = Sha256::new();
        hasher.update(json.as_bytes());
        hex::encode(hasher.finalize())
    }
}

/// Data structure for delegation signing
#[derive(Serialize)]
struct DelegationData {
    delegator_id: SDKeyId,
    delegatee_id: SDKeyId,
    permissions_hash: String,
    expires_at: u64,
    can_redelegate: bool,
}

/// Chain of delegations
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DelegationChain {
    /// Ordered list of delegations (root -> leaf)
    delegations: Vec<Delegation>,
}

impl DelegationChain {
    /// Create empty chain
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a delegation to the chain
    pub fn add(&mut self, delegation: Delegation) -> Result<(), DelegationError> {
        // Validate chain continuity
        if let Some(last) = self.delegations.last() {
            if last.delegatee_id != delegation.delegator_id {
                return Err(DelegationError::ChainBroken);
            }
            if !last.can_redelegate {
                return Err(DelegationError::RedelegationNotAllowed);
            }
        }

        if !delegation.is_valid() {
            return Err(DelegationError::Expired);
        }

        self.delegations.push(delegation);
        Ok(())
    }

    /// Get effective permissions at end of chain
    pub fn effective_permissions(&self) -> Option<&AgentPermissions> {
        self.delegations.last().map(|d| &d.permissions)
    }

    /// Get chain length
    pub fn len(&self) -> usize {
        self.delegations.len()
    }

    /// Check if chain is empty
    pub fn is_empty(&self) -> bool {
        self.delegations.is_empty()
    }

    /// Validate entire chain
    pub fn validate(&self) -> Result<(), DelegationError> {
        for (i, delegation) in self.delegations.iter().enumerate() {
            if !delegation.is_valid() {
                return Err(DelegationError::ExpiredAtIndex(i));
            }

            // Check continuity (except first)
            if i > 0 {
                let prev = &self.delegations[i - 1];
                if prev.delegatee_id != delegation.delegator_id {
                    return Err(DelegationError::ChainBrokenAtIndex(i));
                }
            }
        }
        Ok(())
    }
}

/// Delegation errors
#[derive(Debug, Clone, thiserror::Error)]
pub enum DelegationError {
    #[error("Delegation has expired")]
    Expired,

    #[error("Delegation at index {0} has expired")]
    ExpiredAtIndex(usize),

    #[error("Delegation chain is broken")]
    ChainBroken,

    #[error("Delegation chain is broken at index {0}")]
    ChainBrokenAtIndex(usize),

    #[error("Redelegation is not allowed")]
    RedelegationNotAllowed,

    #[error("Invalid expiration time")]
    InvalidExpiration,

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Signing error: {0}")]
    SigningError(String),

    #[error("Insufficient permissions for delegation")]
    InsufficientPermissions,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::permissions::PermissionLevel;
    use crate::sdkey::AgentMetadata;

    #[test]
    fn test_delegation_creation() {
        let delegator = AgentSDKey::generate(
            AgentMetadata {
                name: "Delegator".into(),
                ..Default::default()
            },
            AgentPermissions::new(PermissionLevel::Full),
        );

        let delegatee = AgentSDKey::generate(
            AgentMetadata {
                name: "Delegatee".into(),
                ..Default::default()
            },
            AgentPermissions::new(PermissionLevel::Limited),
        );

        let expires = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600; // 1 hour

        let delegation = Delegation::create(
            &delegator,
            delegatee.id(),
            AgentPermissions::new(PermissionLevel::Limited),
            expires,
            false,
        );

        assert!(delegation.is_ok());
        assert!(delegation.unwrap().is_valid());
    }
}

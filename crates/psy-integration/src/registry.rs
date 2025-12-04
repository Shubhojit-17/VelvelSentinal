//! Agent Registry for Psy Protocol
//!
//! Manages agent registration, attestation verification, and discovery.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use sdkey_manager::{AgentSDKey, AgentPermissions};

/// Agent registration status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RegistrationStatus {
    /// Pending verification
    Pending,
    /// Active and verified
    Active,
    /// Temporarily suspended
    Suspended,
    /// Permanently revoked
    Revoked,
}

/// Agent registration record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRegistration {
    /// Unique agent ID
    pub agent_id: String,
    /// Agent display name
    pub name: String,
    /// Agent description
    pub description: String,
    /// Agent's public key (Ed25519)
    pub public_key: Vec<u8>,
    /// Agent capabilities
    pub capabilities: Vec<String>,
    /// TEE attestation quote (from Phala)
    pub attestation_quote: Option<Vec<u8>>,
    /// RTMR values from attestation
    pub rtmr_values: Option<[String; 4]>,
    /// Registration timestamp
    pub registered_at: u64,
    /// Last attestation refresh
    pub last_attestation: u64,
    /// Current status
    pub status: RegistrationStatus,
    /// On-chain registry contract address
    pub registry_contract: Option<String>,
    /// Agent owner address
    pub owner_address: Option<String>,
    /// Permissions granted
    pub permissions: AgentPermissions,
    /// Metadata (JSON)
    pub metadata: HashMap<String, String>,
}

impl AgentRegistration {
    /// Create a new registration from an SDKey
    pub fn from_sdkey(sdkey: &AgentSDKey, name: String, description: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            agent_id: sdkey.agent_id().to_string(),
            name,
            description,
            public_key: sdkey.public_key_bytes(),
            capabilities: vec![],
            attestation_quote: None,
            rtmr_values: None,
            registered_at: now,
            last_attestation: now,
            status: RegistrationStatus::Pending,
            registry_contract: None,
            owner_address: None,
            permissions: sdkey.permissions().clone(),
            metadata: HashMap::new(),
        }
    }

    /// Add capability
    pub fn with_capability(mut self, capability: &str) -> Self {
        self.capabilities.push(capability.to_string());
        self
    }

    /// Add TEE attestation
    pub fn with_attestation(mut self, quote: Vec<u8>, rtmrs: [String; 4]) -> Self {
        self.attestation_quote = Some(quote);
        self.rtmr_values = Some(rtmrs);
        self.last_attestation = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        self
    }

    /// Add owner address
    pub fn with_owner(mut self, owner: String) -> Self {
        self.owner_address = Some(owner);
        self
    }

    /// Add registry contract
    pub fn with_registry(mut self, registry: String) -> Self {
        self.registry_contract = Some(registry);
        self
    }

    /// Add metadata
    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }

    /// Check if attestation is fresh (within 24 hours)
    pub fn is_attestation_fresh(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        now - self.last_attestation < 86_400
    }

    /// Check if agent is active
    pub fn is_active(&self) -> bool {
        self.status == RegistrationStatus::Active
    }
}

/// Agent Registry for managing registrations
pub struct AgentRegistry {
    /// Registered agents by ID
    agents: HashMap<String, AgentRegistration>,
    /// Index by public key
    by_public_key: HashMap<Vec<u8>, String>,
    /// Index by owner address
    by_owner: HashMap<String, Vec<String>>,
    /// Registry contract address
    contract_address: Option<String>,
}

impl AgentRegistry {
    /// Create new registry
    pub fn new() -> Self {
        Self {
            agents: HashMap::new(),
            by_public_key: HashMap::new(),
            by_owner: HashMap::new(),
            contract_address: None,
        }
    }

    /// Create registry with contract address
    pub fn with_contract(contract_address: String) -> Self {
        Self {
            contract_address: Some(contract_address),
            ..Self::new()
        }
    }

    /// Register a new agent
    pub fn register(&mut self, mut registration: AgentRegistration) -> Result<String, RegistryError> {
        // Check for duplicate ID
        if self.agents.contains_key(&registration.agent_id) {
            return Err(RegistryError::AlreadyRegistered(registration.agent_id));
        }

        // Check for duplicate public key
        if self.by_public_key.contains_key(&registration.public_key) {
            return Err(RegistryError::DuplicatePublicKey);
        }

        let agent_id = registration.agent_id.clone();

        // Validate attestation if present
        if registration.attestation_quote.is_some() {
            registration.status = RegistrationStatus::Active;
        }

        // Index by public key
        self.by_public_key.insert(
            registration.public_key.clone(),
            agent_id.clone(),
        );

        // Index by owner
        if let Some(ref owner) = registration.owner_address {
            self.by_owner
                .entry(owner.clone())
                .or_insert_with(Vec::new)
                .push(agent_id.clone());
        }

        // Store registration
        self.agents.insert(agent_id.clone(), registration);

        Ok(agent_id)
    }

    /// Get agent by ID
    pub fn get(&self, agent_id: &str) -> Option<&AgentRegistration> {
        self.agents.get(agent_id)
    }

    /// Get agent by public key
    pub fn get_by_public_key(&self, public_key: &[u8]) -> Option<&AgentRegistration> {
        self.by_public_key
            .get(public_key)
            .and_then(|id| self.agents.get(id))
    }

    /// Get agents by owner
    pub fn get_by_owner(&self, owner: &str) -> Vec<&AgentRegistration> {
        self.by_owner
            .get(owner)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.agents.get(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Update agent status
    pub fn update_status(&mut self, agent_id: &str, status: RegistrationStatus) -> Result<(), RegistryError> {
        let agent = self.agents.get_mut(agent_id)
            .ok_or_else(|| RegistryError::NotFound(agent_id.to_string()))?;
        agent.status = status;
        Ok(())
    }

    /// Refresh attestation
    pub fn refresh_attestation(
        &mut self,
        agent_id: &str,
        quote: Vec<u8>,
        rtmrs: [String; 4],
    ) -> Result<(), RegistryError> {
        let agent = self.agents.get_mut(agent_id)
            .ok_or_else(|| RegistryError::NotFound(agent_id.to_string()))?;

        agent.attestation_quote = Some(quote);
        agent.rtmr_values = Some(rtmrs);
        agent.last_attestation = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if agent.status == RegistrationStatus::Pending {
            agent.status = RegistrationStatus::Active;
        }

        Ok(())
    }

    /// List all active agents
    pub fn list_active(&self) -> Vec<&AgentRegistration> {
        self.agents
            .values()
            .filter(|a| a.is_active())
            .collect()
    }

    /// List agents with capability
    pub fn list_by_capability(&self, capability: &str) -> Vec<&AgentRegistration> {
        self.agents
            .values()
            .filter(|a| a.is_active() && a.capabilities.contains(&capability.to_string()))
            .collect()
    }

    /// Get total registered count
    pub fn count(&self) -> usize {
        self.agents.len()
    }

    /// Get active count
    pub fn active_count(&self) -> usize {
        self.agents.values().filter(|a| a.is_active()).count()
    }
}

impl Default for AgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Registry errors
#[derive(Debug, Clone, thiserror::Error)]
pub enum RegistryError {
    #[error("Agent already registered: {0}")]
    AlreadyRegistered(String),

    #[error("Agent not found: {0}")]
    NotFound(String),

    #[error("Duplicate public key")]
    DuplicatePublicKey,

    #[error("Invalid attestation")]
    InvalidAttestation,

    #[error("Permission denied")]
    PermissionDenied,
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkey_manager::{AgentSDKey, AgentMetadata, AgentPermissions};

    #[test]
    fn test_agent_registration() {
        let metadata = AgentMetadata {
            name: "agent-001".into(),
            version: "1.0.0".into(),
            ..Default::default()
        };
        let sdkey = AgentSDKey::generate(metadata, AgentPermissions::default());
        let agent_id = sdkey.agent_id();
        let registration = AgentRegistration::from_sdkey(
            &sdkey,
            "Test Agent".into(),
            "A test agent".into(),
        )
        .with_capability("trading")
        .with_capability("governance");

        let mut registry = AgentRegistry::new();
        let result = registry.register(registration);
        assert!(result.is_ok());

        let agent = registry.get(&agent_id);
        assert!(agent.is_some());
        assert_eq!(agent.unwrap().capabilities.len(), 2);
    }

    #[test]
    fn test_capability_search() {
        let mut registry = AgentRegistry::new();

        // Register trading agent
        let metadata1 = AgentMetadata {
            name: "trader-001".into(),
            version: "1.0.0".into(),
            ..Default::default()
        };
        let sdkey1 = AgentSDKey::generate(metadata1, AgentPermissions::default());
        let trader_id = sdkey1.agent_id();
        let mut reg1 = AgentRegistration::from_sdkey(&sdkey1, "Trader".into(), "".into())
            .with_capability("trading");
        reg1.status = RegistrationStatus::Active;
        registry.register(reg1).unwrap();

        // Register governance agent
        let metadata2 = AgentMetadata {
            name: "gov-001".into(),
            version: "1.0.0".into(),
            ..Default::default()
        };
        let sdkey2 = AgentSDKey::generate(metadata2, AgentPermissions::default());
        let mut reg2 = AgentRegistration::from_sdkey(&sdkey2, "Governor".into(), "".into())
            .with_capability("governance");
        reg2.status = RegistrationStatus::Active;
        registry.register(reg2).unwrap();

        let traders = registry.list_by_capability("trading");
        assert_eq!(traders.len(), 1);
        assert_eq!(traders[0].agent_id, trader_id);
    }
}

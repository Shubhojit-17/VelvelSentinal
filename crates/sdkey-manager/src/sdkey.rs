//! SDKey - Self-Describing Key Identity

use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer, Verifier};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

use crate::permissions::AgentPermissions;

/// Unique identifier for an SDKey (32 bytes)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SDKeyId(pub [u8; 32]);

impl SDKeyId {
    /// Create from raw bytes
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create from hex string
    pub fn from_hex(hex: &str) -> Result<Self, SDKeyError> {
        let bytes = hex::decode(hex)
            .map_err(|_| SDKeyError::InvalidHex)?;
        if bytes.len() != 32 {
            return Err(SDKeyError::InvalidKeyLength);
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes);
        Ok(Self(arr))
    }

    /// Convert to hex string
    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }
}

impl std::fmt::Display for SDKeyId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}

/// Agent identity using Psy Protocol SDKeys
#[derive(Clone)]
pub struct AgentSDKey {
    /// Unique key identifier
    id: SDKeyId,
    /// Ed25519 signing key (private)
    signing_key: SigningKey,
    /// Ed25519 verifying key (public)
    verifying_key: VerifyingKey,
    /// Agent permissions
    permissions: AgentPermissions,
    /// Creation timestamp (Unix seconds)
    created_at: u64,
    /// Optional expiration timestamp
    expires_at: Option<u64>,
    /// Agent metadata
    metadata: AgentMetadata,
}

/// Agent metadata
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AgentMetadata {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub owner_address: Option<String>,
    pub tee_attestation_hash: Option<String>,
}

impl AgentSDKey {
    /// Create a new SDKey with random key generation
    pub fn generate(metadata: AgentMetadata, permissions: AgentPermissions) -> Self {
        let signing_key = SigningKey::generate(&mut OsRng);
        let verifying_key = signing_key.verifying_key();
        
        // Derive ID from public key hash
        let mut hasher = Sha256::new();
        hasher.update(verifying_key.as_bytes());
        let hash = hasher.finalize();
        let mut id_bytes = [0u8; 32];
        id_bytes.copy_from_slice(&hash);

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id: SDKeyId(id_bytes),
            signing_key,
            verifying_key,
            permissions,
            created_at: now,
            expires_at: None,
            metadata,
        }
    }

    /// Create from existing seed (deterministic)
    pub fn from_seed(
        seed: &[u8; 32],
        metadata: AgentMetadata,
        permissions: AgentPermissions,
    ) -> Self {
        let signing_key = SigningKey::from_bytes(seed);
        let verifying_key = signing_key.verifying_key();
        
        // Derive ID from public key hash
        let mut hasher = Sha256::new();
        hasher.update(verifying_key.as_bytes());
        let hash = hasher.finalize();
        let mut id_bytes = [0u8; 32];
        id_bytes.copy_from_slice(&hash);

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id: SDKeyId(id_bytes),
            signing_key,
            verifying_key,
            permissions,
            created_at: now,
            expires_at: None,
            metadata,
        }
    }

    /// Get the key ID
    pub fn id(&self) -> SDKeyId {
        self.id
    }

    /// Get agent ID as string (convenience method)
    pub fn agent_id(&self) -> String {
        self.id.to_hex()
    }

    /// Get public key bytes
    pub fn public_key(&self) -> [u8; 32] {
        *self.verifying_key.as_bytes()
    }

    /// Get public key as Vec<u8>
    pub fn public_key_bytes(&self) -> Vec<u8> {
        self.verifying_key.as_bytes().to_vec()
    }

    /// Get public key as hex
    pub fn public_key_hex(&self) -> String {
        hex::encode(self.verifying_key.as_bytes())
    }

    /// Get permissions
    pub fn permissions(&self) -> &AgentPermissions {
        &self.permissions
    }

    /// Get mutable permissions
    pub fn permissions_mut(&mut self) -> &mut AgentPermissions {
        &mut self.permissions
    }

    /// Get metadata
    pub fn metadata(&self) -> &AgentMetadata {
        &self.metadata
    }

    /// Set expiration
    pub fn set_expiration(&mut self, timestamp: u64) {
        self.expires_at = Some(timestamp);
    }

    /// Check if key is expired
    pub fn is_expired(&self) -> bool {
        if let Some(expires) = self.expires_at {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            now >= expires
        } else {
            false
        }
    }

    /// Sign a message
    pub fn sign(&self, message: &[u8]) -> Result<[u8; 64], SDKeyError> {
        if self.is_expired() {
            return Err(SDKeyError::KeyExpired);
        }
        let signature = self.signing_key.sign(message);
        Ok(signature.to_bytes())
    }

    /// Sign a message and return hex
    pub fn sign_hex(&self, message: &[u8]) -> Result<String, SDKeyError> {
        let sig = self.sign(message)?;
        Ok(hex::encode(sig))
    }

    /// Verify a signature
    pub fn verify(&self, message: &[u8], signature: &[u8; 64]) -> Result<(), SDKeyError> {
        let sig = Signature::from_bytes(signature);
        self.verifying_key
            .verify(message, &sig)
            .map_err(|_| SDKeyError::InvalidSignature)
    }

    /// Check if a trade can be executed
    pub fn can_execute_trade(
        &self,
        size_usd: u64,
        protocol: &str,
        token: &str,
        network: &str,
    ) -> bool {
        if self.is_expired() {
            return false;
        }
        self.permissions
            .can_execute_trade(size_usd, protocol, token, network)
            .is_ok()
    }

    /// Export public identity (safe to share)
    pub fn export_public(&self) -> PublicAgentIdentity {
        PublicAgentIdentity {
            id: self.id,
            public_key: self.public_key_hex(),
            permissions: self.permissions.clone(),
            metadata: self.metadata.clone(),
            created_at: self.created_at,
            expires_at: self.expires_at,
        }
    }
}

/// Public agent identity (can be shared)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicAgentIdentity {
    pub id: SDKeyId,
    pub public_key: String,
    pub permissions: AgentPermissions,
    pub metadata: AgentMetadata,
    pub created_at: u64,
    pub expires_at: Option<u64>,
}

/// SDKey errors
#[derive(Debug, Clone, thiserror::Error)]
pub enum SDKeyError {
    #[error("Invalid hex encoding")]
    InvalidHex,

    #[error("Invalid key length")]
    InvalidKeyLength,

    #[error("Key has expired")]
    KeyExpired,

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Signing failed: {0}")]
    SigningFailed(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::permissions::PermissionLevel;

    #[test]
    fn test_sdkey_generation() {
        let metadata = AgentMetadata {
            name: "TestAgent".into(),
            version: "1.0.0".into(),
            ..Default::default()
        };
        let perms = AgentPermissions::new(PermissionLevel::Standard);
        
        let key = AgentSDKey::generate(metadata, perms);
        
        assert!(!key.is_expired());
        assert_eq!(key.metadata().name, "TestAgent");
    }

    #[test]
    fn test_sign_and_verify() {
        let key = AgentSDKey::generate(
            AgentMetadata::default(),
            AgentPermissions::default(),
        );
        
        let message = b"Hello, Velvet Sentinel!";
        let signature = key.sign(message).unwrap();
        
        assert!(key.verify(message, &signature).is_ok());
        
        // Tampered message should fail
        let tampered = b"Hello, Evil Agent!";
        assert!(key.verify(tampered, &signature).is_err());
    }

    #[test]
    fn test_deterministic_from_seed() {
        let seed = [42u8; 32];
        let key1 = AgentSDKey::from_seed(&seed, AgentMetadata::default(), AgentPermissions::default());
        let key2 = AgentSDKey::from_seed(&seed, AgentMetadata::default(), AgentPermissions::default());
        
        assert_eq!(key1.id(), key2.id());
        assert_eq!(key1.public_key(), key2.public_key());
    }
}

//! ZK Proof Verifier

use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

use crate::proofs::{PerformanceProof, ProofError, ThresholdCondition};

/// Result of proof verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    /// Whether the proof is valid
    pub valid: bool,
    /// Proof ID that was verified
    pub proof_id: String,
    /// Agent ID from the proof
    pub agent_id: String,
    /// Verification timestamp
    pub verified_at: u64,
    /// Any warnings or notes
    pub notes: Vec<String>,
}

impl VerificationResult {
    fn success(proof: &PerformanceProof) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            valid: true,
            proof_id: proof.id.clone(),
            agent_id: proof.agent_id.clone(),
            verified_at: now,
            notes: vec![],
        }
    }

    fn failure(proof: &PerformanceProof, reason: &str) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            valid: false,
            proof_id: proof.id.clone(),
            agent_id: proof.agent_id.clone(),
            verified_at: now,
            notes: vec![format!("Verification failed: {}", reason)],
        }
    }
}

/// Verifier for ZK proofs
pub struct ProofVerifier {
    /// Accepted proof versions
    accepted_versions: Vec<String>,
    /// Maximum proof age in seconds
    max_proof_age: u64,
}

impl Default for ProofVerifier {
    fn default() -> Self {
        Self {
            accepted_versions: vec!["PLACEHOLDER_PROOF_V1".into()],
            max_proof_age: 2_592_000, // 30 days
        }
    }
}

impl ProofVerifier {
    /// Create new verifier
    pub fn new() -> Self {
        Self::default()
    }

    /// Set maximum proof age
    pub fn with_max_age(mut self, max_age_seconds: u64) -> Self {
        self.max_proof_age = max_age_seconds;
        self
    }

    /// Verify a proof
    pub fn verify(&self, proof: &PerformanceProof) -> Result<VerificationResult, ProofError> {
        // Check expiration
        if proof.is_expired() {
            return Ok(VerificationResult::failure(proof, "Proof has expired"));
        }

        // Check age
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if now - proof.generated_at > self.max_proof_age {
            return Ok(VerificationResult::failure(proof, "Proof is too old"));
        }

        // Verify proof data structure
        if proof.proof_data.len() != 32 {
            return Ok(VerificationResult::failure(proof, "Invalid proof data length"));
        }

        // Verify proof data (placeholder verification)
        // In production: actual ZK verification
        let expected_prefix = self.compute_expected_proof_prefix(proof);
        if !proof.proof_data.starts_with(&expected_prefix[..8]) {
            return Ok(VerificationResult::failure(proof, "Proof data verification failed"));
        }

        // Check public inputs are reasonable
        if !self.validate_public_inputs(&proof.public_inputs) {
            return Ok(VerificationResult::failure(proof, "Invalid public inputs"));
        }

        Ok(VerificationResult::success(proof))
    }

    /// Batch verify multiple proofs
    pub fn verify_batch(&self, proofs: &[PerformanceProof]) -> Vec<VerificationResult> {
        proofs.iter().map(|p| {
            self.verify(p).unwrap_or_else(|e| VerificationResult {
                valid: false,
                proof_id: p.id.clone(),
                agent_id: p.agent_id.clone(),
                verified_at: 0,
                notes: vec![format!("Verification error: {}", e)],
            })
        }).collect()
    }

    /// Compute expected proof prefix for verification
    fn compute_expected_proof_prefix(&self, proof: &PerformanceProof) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(proof.commitment.as_bytes());
        hasher.update(proof.public_inputs.threshold.to_le_bytes());
        hasher.update(&[proof.public_inputs.condition as u8]);
        hasher.update(b"PLACEHOLDER_PROOF_V1");
        hasher.finalize().to_vec()
    }

    /// Validate public inputs
    fn validate_public_inputs(&self, inputs: &crate::proofs::ProofPublicInputs) -> bool {
        // Period must be valid
        if inputs.period_end <= inputs.period_start {
            return false;
        }

        // Period shouldn't be too long (max 1 year)
        if inputs.period_end - inputs.period_start > 31_536_000 {
            return false;
        }

        // Threshold should be reasonable
        match inputs.condition {
            ThresholdCondition::GreaterThan | ThresholdCondition::GreaterOrEqual => {
                // For "greater than" conditions, threshold should be reasonable
                inputs.threshold >= -100_000 && inputs.threshold <= 100_000
            }
            ThresholdCondition::LessThan | ThresholdCondition::LessOrEqual => {
                // For "less than" conditions (like drawdown), should be positive
                inputs.threshold >= 0 && inputs.threshold <= 100_000
            }
        }
    }
}

/// On-chain verification helper (for smart contract integration)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OnChainProofData {
    /// Proof ID
    pub proof_id: String,
    /// Agent public key or address
    pub agent_address: String,
    /// Commitment hash
    pub commitment: String,
    /// Proof type as u8
    pub proof_type: u8,
    /// Threshold value
    pub threshold: i64,
    /// Condition as u8
    pub condition: u8,
    /// Period start
    pub period_start: u64,
    /// Period end
    pub period_end: u64,
    /// Proof bytes (for on-chain verification)
    pub proof_bytes: Vec<u8>,
}

impl From<&PerformanceProof> for OnChainProofData {
    fn from(proof: &PerformanceProof) -> Self {
        Self {
            proof_id: proof.id.clone(),
            agent_address: proof.agent_id.clone(),
            commitment: proof.commitment.clone(),
            proof_type: proof.proof_type as u8,
            threshold: proof.public_inputs.threshold,
            condition: proof.public_inputs.condition as u8,
            period_start: proof.public_inputs.period_start,
            period_end: proof.public_inputs.period_end,
            proof_bytes: proof.proof_data.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::performance::{PerformanceMetrics, PerformancePeriod};

    #[test]
    fn test_proof_verification() {
        let mut metrics = PerformanceMetrics::new("agent-001".into(), PerformancePeriod::Monthly);
        metrics.pnl_bps = 500;

        let proof = PerformanceProof::prove_pnl_threshold(&metrics, 300).unwrap();
        let verifier = ProofVerifier::new();
        let result = verifier.verify(&proof).unwrap();

        assert!(result.valid);
    }

    #[test]
    fn test_batch_verification() {
        let mut metrics = PerformanceMetrics::new("agent-001".into(), PerformancePeriod::Weekly);
        metrics.pnl_bps = 500;
        metrics.sharpe_ratio_x100 = 200;

        let proof1 = PerformanceProof::prove_pnl_threshold(&metrics, 300).unwrap();
        let proof2 = PerformanceProof::prove_sharpe_threshold(&metrics, 150).unwrap();

        let verifier = ProofVerifier::new();
        let results = verifier.verify_batch(&[proof1, proof2]);

        assert_eq!(results.len(), 2);
        assert!(results.iter().all(|r| r.valid));
    }
}

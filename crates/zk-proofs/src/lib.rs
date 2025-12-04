//! ZK Proofs - Zero-Knowledge Performance Verification
//!
//! Provides ZK proof generation and verification for agent performance metrics.
//! This allows agents to prove their trading performance without revealing
//! specific trade details.

mod performance;
mod proofs;
mod verifier;

pub use performance::{PerformanceMetrics, PerformancePeriod};
pub use proofs::{PerformanceProof, ProofError, ProofType};
pub use verifier::{ProofVerifier, VerificationResult};

/// Re-export common types
pub mod prelude {
    pub use crate::{
        PerformanceMetrics, PerformanceProof, ProofError, ProofType,
        ProofVerifier, VerificationResult,
    };
}

//! Performance metrics for ZK proofs

use serde::{Deserialize, Serialize};

/// Time period for performance measurement
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PerformancePeriod {
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
    Custom { days: u32 },
}

impl PerformancePeriod {
    /// Get period duration in seconds
    pub fn duration_seconds(&self) -> u64 {
        match self {
            Self::Daily => 86_400,
            Self::Weekly => 604_800,
            Self::Monthly => 2_592_000,      // 30 days
            Self::Quarterly => 7_776_000,    // 90 days
            Self::Yearly => 31_536_000,      // 365 days
            Self::Custom { days } => *days as u64 * 86_400,
        }
    }
}

/// Agent performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    /// Agent identifier
    pub agent_id: String,
    /// Performance period
    pub period: PerformancePeriod,
    /// Period start timestamp (Unix seconds)
    pub period_start: u64,
    /// Period end timestamp (Unix seconds)
    pub period_end: u64,
    /// Total PnL in basis points (can be negative)
    pub pnl_bps: i64,
    /// Sharpe ratio * 100 (for integer representation)
    pub sharpe_ratio_x100: i32,
    /// Maximum drawdown in basis points
    pub max_drawdown_bps: u32,
    /// Total number of trades
    pub trade_count: u32,
    /// Win rate in basis points (0-10000)
    pub win_rate_bps: u32,
    /// Average trade size in USD
    pub avg_trade_size_usd: u64,
    /// Total volume traded in USD
    pub total_volume_usd: u64,
}

impl PerformanceMetrics {
    /// Create new metrics
    pub fn new(agent_id: String, period: PerformancePeriod) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            agent_id,
            period,
            period_start: now - period.duration_seconds(),
            period_end: now,
            pnl_bps: 0,
            sharpe_ratio_x100: 0,
            max_drawdown_bps: 0,
            trade_count: 0,
            win_rate_bps: 0,
            avg_trade_size_usd: 0,
            total_volume_usd: 0,
        }
    }

    /// Check if metrics meet minimum requirements
    pub fn meets_minimum_requirements(&self, requirements: &PerformanceRequirements) -> bool {
        self.pnl_bps >= requirements.min_pnl_bps
            && self.sharpe_ratio_x100 >= requirements.min_sharpe_x100
            && self.max_drawdown_bps <= requirements.max_drawdown_bps
            && self.trade_count >= requirements.min_trade_count
    }

    /// Calculate a reputation score (0-1000)
    pub fn reputation_score(&self) -> u32 {
        let mut score = 500u32; // Base score

        // PnL contribution (up to +/- 200 points)
        let pnl_contribution = (self.pnl_bps / 50).clamp(-200, 200) as i32;
        score = (score as i32 + pnl_contribution).max(0) as u32;

        // Sharpe ratio contribution (up to +/- 150 points)
        let sharpe_contribution = (self.sharpe_ratio_x100 / 10).clamp(-150, 150);
        score = (score as i32 + sharpe_contribution).max(0) as u32;

        // Drawdown penalty (up to -100 points)
        let drawdown_penalty = (self.max_drawdown_bps / 100).min(100);
        score = score.saturating_sub(drawdown_penalty);

        // Win rate bonus (up to +50 points)
        if self.win_rate_bps > 5000 {
            let bonus = ((self.win_rate_bps - 5000) / 100).min(50);
            score = score.saturating_add(bonus);
        }

        score.min(1000)
    }

    /// Create commitment hash for the metrics
    pub fn commitment(&self) -> String {
        use sha2::{Sha256, Digest};
        let json = serde_json::to_string(self).unwrap_or_default();
        let mut hasher = Sha256::new();
        hasher.update(json.as_bytes());
        hex::encode(hasher.finalize())
    }
}

/// Minimum performance requirements for syndicate membership
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceRequirements {
    /// Minimum PnL in basis points
    pub min_pnl_bps: i64,
    /// Minimum Sharpe ratio * 100
    pub min_sharpe_x100: i32,
    /// Maximum drawdown in basis points
    pub max_drawdown_bps: u32,
    /// Minimum number of trades
    pub min_trade_count: u32,
}

impl Default for PerformanceRequirements {
    fn default() -> Self {
        Self {
            min_pnl_bps: 0,           // At least break-even
            min_sharpe_x100: 100,     // Sharpe ratio >= 1.0
            max_drawdown_bps: 2000,   // Max 20% drawdown
            min_trade_count: 10,      // At least 10 trades
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_metrics() {
        let mut metrics = PerformanceMetrics::new(
            "agent-001".into(),
            PerformancePeriod::Monthly,
        );
        
        metrics.pnl_bps = 500;        // 5% profit
        metrics.sharpe_ratio_x100 = 150; // 1.5 Sharpe
        metrics.max_drawdown_bps = 1000; // 10% max DD
        metrics.trade_count = 50;
        metrics.win_rate_bps = 6000;  // 60% win rate

        let score = metrics.reputation_score();
        assert!(score > 500); // Should be above baseline

        let requirements = PerformanceRequirements::default();
        assert!(metrics.meets_minimum_requirements(&requirements));
    }

    #[test]
    fn test_commitment_hash() {
        let metrics = PerformanceMetrics::new("agent-001".into(), PerformancePeriod::Daily);
        let hash = metrics.commitment();
        assert_eq!(hash.len(), 64); // SHA256 hex = 64 chars
    }
}

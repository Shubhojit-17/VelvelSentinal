//! Reputation Tracking for Psy Protocol
//!
//! Tracks and manages agent reputation based on performance and behavior.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Reputation level thresholds
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum ReputationLevel {
    /// New agent, unverified
    Newcomer,    // 0-199
    /// Verified but limited track record
    Verified,    // 200-399
    /// Established performance
    Established, // 400-599
    /// Consistent strong performance
    Trusted,     // 600-799
    /// Top tier agents
    Elite,       // 800-999
    /// Maximum reputation
    Legendary,   // 1000
}

impl ReputationLevel {
    /// Get level from score
    pub fn from_score(score: u32) -> Self {
        match score {
            0..=199 => Self::Newcomer,
            200..=399 => Self::Verified,
            400..=599 => Self::Established,
            600..=799 => Self::Trusted,
            800..=999 => Self::Elite,
            _ => Self::Legendary,
        }
    }

    /// Get minimum score for level
    pub fn min_score(&self) -> u32 {
        match self {
            Self::Newcomer => 0,
            Self::Verified => 200,
            Self::Established => 400,
            Self::Trusted => 600,
            Self::Elite => 800,
            Self::Legendary => 1000,
        }
    }

    /// Get level name
    pub fn name(&self) -> &'static str {
        match self {
            Self::Newcomer => "Newcomer",
            Self::Verified => "Verified",
            Self::Established => "Established",
            Self::Trusted => "Trusted",
            Self::Elite => "Elite",
            Self::Legendary => "Legendary",
        }
    }
}

/// Reputation event type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReputationEvent {
    /// Successful trade
    TradeSuccess {
        pnl_bps: i64,
        volume_usd: u64,
    },
    /// Failed trade
    TradeFailed {
        loss_bps: i64,
    },
    /// Governance participation
    GovernanceVote,
    /// Proposal creation
    ProposalCreated {
        passed: bool,
    },
    /// Attestation verified
    AttestationVerified,
    /// Attestation expired
    AttestationExpired,
    /// ZK proof submitted
    ProofSubmitted,
    /// Syndicate contribution
    SyndicateContribution {
        amount: u64,
    },
    /// Uptime reward
    UptimeReward {
        hours: u32,
    },
    /// Slashing event
    Slashed {
        reason: String,
        amount: i32,
    },
    /// Manual adjustment
    ManualAdjustment {
        reason: String,
        amount: i32,
    },
}

impl ReputationEvent {
    /// Calculate reputation delta for event
    pub fn reputation_delta(&self) -> i32 {
        match self {
            Self::TradeSuccess { pnl_bps, volume_usd } => {
                // Reward based on PnL and volume
                let pnl_reward = (*pnl_bps / 100).clamp(0, 10) as i32;
                let volume_reward = ((*volume_usd / 10000).min(5)) as i32;
                pnl_reward + volume_reward
            }
            Self::TradeFailed { loss_bps } => {
                // Penalty for losses
                (-loss_bps / 200).clamp(-20, 0) as i32
            }
            Self::GovernanceVote => 1,
            Self::ProposalCreated { passed } => {
                if *passed { 5 } else { -2 }
            }
            Self::AttestationVerified => 10,
            Self::AttestationExpired => -20,
            Self::ProofSubmitted => 5,
            Self::SyndicateContribution { amount } => {
                ((*amount / 1000).min(20)) as i32
            }
            Self::UptimeReward { hours } => {
                ((*hours / 24).min(7)) as i32
            }
            Self::Slashed { amount, .. } => -*amount,
            Self::ManualAdjustment { amount, .. } => *amount,
        }
    }
}

/// Reputation record for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReputationRecord {
    /// Agent ID
    pub agent_id: String,
    /// Current score (0-1000)
    pub score: u32,
    /// Current level
    pub level: ReputationLevel,
    /// Event history (last N events)
    pub history: Vec<ReputationEventRecord>,
    /// Total events processed
    pub total_events: u64,
    /// Last update timestamp
    pub last_updated: u64,
}

/// Recorded reputation event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReputationEventRecord {
    /// Event
    pub event: ReputationEvent,
    /// Delta applied
    pub delta: i32,
    /// Score after event
    pub score_after: u32,
    /// Timestamp
    pub timestamp: u64,
}

impl ReputationRecord {
    /// Create new record for agent
    pub fn new(agent_id: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            agent_id,
            score: 100, // Start with newcomer baseline
            level: ReputationLevel::Newcomer,
            history: Vec::new(),
            total_events: 0,
            last_updated: now,
        }
    }

    /// Apply a reputation event
    pub fn apply_event(&mut self, event: ReputationEvent) -> i32 {
        let delta = event.reputation_delta();
        let new_score = (self.score as i32 + delta).clamp(0, 1000) as u32;
        
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Record event
        let record = ReputationEventRecord {
            event,
            delta,
            score_after: new_score,
            timestamp: now,
        };

        // Keep last 100 events
        if self.history.len() >= 100 {
            self.history.remove(0);
        }
        self.history.push(record);

        self.score = new_score;
        self.level = ReputationLevel::from_score(new_score);
        self.total_events += 1;
        self.last_updated = now;

        delta
    }

    /// Get recent history
    pub fn recent_history(&self, count: usize) -> &[ReputationEventRecord] {
        let start = self.history.len().saturating_sub(count);
        &self.history[start..]
    }

    /// Calculate 7-day trend
    pub fn weekly_trend(&self) -> i32 {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let week_ago = now - 604_800;

        self.history
            .iter()
            .filter(|r| r.timestamp >= week_ago)
            .map(|r| r.delta)
            .sum()
    }
}

/// Reputation tracker for multiple agents
pub struct ReputationTracker {
    /// Agent records
    records: HashMap<String, ReputationRecord>,
    /// Leaderboard cache
    leaderboard_cache: Vec<String>,
    /// Last leaderboard update
    leaderboard_updated: u64,
}

impl ReputationTracker {
    /// Create new tracker
    pub fn new() -> Self {
        Self {
            records: HashMap::new(),
            leaderboard_cache: Vec::new(),
            leaderboard_updated: 0,
        }
    }

    /// Get or create record for agent
    pub fn get_or_create(&mut self, agent_id: &str) -> &mut ReputationRecord {
        self.records.entry(agent_id.to_string())
            .or_insert_with(|| ReputationRecord::new(agent_id.to_string()))
    }

    /// Get record for agent
    pub fn get(&self, agent_id: &str) -> Option<&ReputationRecord> {
        self.records.get(agent_id)
    }

    /// Apply event to agent
    pub fn apply_event(&mut self, agent_id: &str, event: ReputationEvent) -> i32 {
        self.get_or_create(agent_id).apply_event(event)
    }

    /// Get agent score
    pub fn score(&self, agent_id: &str) -> u32 {
        self.records.get(agent_id).map(|r| r.score).unwrap_or(0)
    }

    /// Get agent level
    pub fn level(&self, agent_id: &str) -> ReputationLevel {
        self.records.get(agent_id)
            .map(|r| r.level)
            .unwrap_or(ReputationLevel::Newcomer)
    }

    /// Get leaderboard (top N agents)
    pub fn leaderboard(&mut self, count: usize) -> Vec<(&String, &ReputationRecord)> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Refresh cache every 60 seconds
        if now - self.leaderboard_updated > 60 {
            let mut sorted: Vec<_> = self.records.iter().collect();
            sorted.sort_by(|a, b| b.1.score.cmp(&a.1.score));
            self.leaderboard_cache = sorted.iter().map(|(id, _)| (*id).clone()).collect();
            self.leaderboard_updated = now;
        }

        self.leaderboard_cache
            .iter()
            .take(count)
            .filter_map(|id| self.records.get(id).map(|r| (id, r)))
            .collect()
    }

    /// Get agents at or above level
    pub fn agents_at_level(&self, min_level: ReputationLevel) -> Vec<&ReputationRecord> {
        self.records
            .values()
            .filter(|r| r.level >= min_level)
            .collect()
    }

    /// Get agents in score range
    pub fn agents_in_range(&self, min: u32, max: u32) -> Vec<&ReputationRecord> {
        self.records
            .values()
            .filter(|r| r.score >= min && r.score <= max)
            .collect()
    }

    /// Total tracked agents
    pub fn agent_count(&self) -> usize {
        self.records.len()
    }

    /// Export all records
    pub fn export(&self) -> Vec<&ReputationRecord> {
        self.records.values().collect()
    }
}

impl Default for ReputationTracker {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reputation_levels() {
        assert_eq!(ReputationLevel::from_score(50), ReputationLevel::Newcomer);
        assert_eq!(ReputationLevel::from_score(300), ReputationLevel::Verified);
        assert_eq!(ReputationLevel::from_score(500), ReputationLevel::Established);
        assert_eq!(ReputationLevel::from_score(750), ReputationLevel::Trusted);
        assert_eq!(ReputationLevel::from_score(900), ReputationLevel::Elite);
        assert_eq!(ReputationLevel::from_score(1000), ReputationLevel::Legendary);
    }

    #[test]
    fn test_reputation_events() {
        let mut tracker = ReputationTracker::new();

        // Successful trade
        let delta = tracker.apply_event(
            "agent-001",
            ReputationEvent::TradeSuccess { pnl_bps: 500, volume_usd: 50000 },
        );
        assert!(delta > 0);

        // Governance vote
        tracker.apply_event("agent-001", ReputationEvent::GovernanceVote);

        let record = tracker.get("agent-001").unwrap();
        assert!(record.score > 100); // Above baseline
    }

    #[test]
    fn test_reputation_bounds() {
        let mut record = ReputationRecord::new("test".into());
        record.score = 1000;

        // Should not exceed 1000
        let delta = record.apply_event(ReputationEvent::AttestationVerified);
        assert!(delta > 0);
        assert_eq!(record.score, 1000);

        // Reset to low score
        record.score = 5;

        // Should not go below 0
        let delta = record.apply_event(ReputationEvent::Slashed {
            reason: "test".into(),
            amount: 100,
        });
        assert!(delta < 0);
        assert_eq!(record.score, 0);
    }
}

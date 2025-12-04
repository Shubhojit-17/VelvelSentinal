//! Agent permissions and trading restrictions

use serde::{Deserialize, Serialize};

/// Permission level for agent operations
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionLevel {
    /// Read-only access - can query but not execute
    ReadOnly,
    /// Limited trading with strict constraints
    Limited,
    /// Standard trading within defined parameters
    Standard,
    /// Full trading capabilities (still bound by restrictions)
    Full,
    /// Administrative access
    Admin,
}

impl Default for PermissionLevel {
    fn default() -> Self {
        Self::Limited
    }
}

/// Trading restrictions for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingRestrictions {
    /// Maximum single trade size in USD
    pub max_trade_size_usd: u64,
    /// Maximum daily trading volume in USD
    pub max_daily_volume_usd: u64,
    /// Daily loss limit in basis points (100 = 1%)
    pub daily_loss_limit_bps: u16,
    /// Maximum leverage allowed (100 = 1x, 200 = 2x)
    pub max_leverage_bps: u16,
    /// Whether flash loans are permitted
    pub allow_flash_loans: bool,
    /// Maximum slippage tolerance in basis points
    pub max_slippage_bps: u16,
}

impl Default for TradingRestrictions {
    fn default() -> Self {
        Self {
            max_trade_size_usd: 10_000,
            max_daily_volume_usd: 100_000,
            daily_loss_limit_bps: 500, // 5%
            max_leverage_bps: 100,     // 1x (no leverage)
            allow_flash_loans: false,
            max_slippage_bps: 50,      // 0.5%
        }
    }
}

/// Complete permission set for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPermissions {
    /// Overall permission level
    pub level: PermissionLevel,
    /// Allowed DeFi protocols
    pub allowed_protocols: Vec<String>,
    /// Allowed tokens for trading
    pub allowed_tokens: Vec<String>,
    /// Allowed blockchain networks
    pub allowed_networks: Vec<String>,
    /// Trading restrictions
    pub trading: TradingRestrictions,
    /// Active hours (UTC) - None means 24/7
    pub active_hours: Option<(u8, u8)>,
    /// Require human approval above this USD amount
    pub approval_threshold_usd: Option<u64>,
}

impl Default for AgentPermissions {
    fn default() -> Self {
        Self {
            level: PermissionLevel::Limited,
            allowed_protocols: vec![
                "uniswap".into(),
                "aave".into(),
                "compound".into(),
            ],
            allowed_tokens: vec![
                "ETH".into(),
                "WETH".into(),
                "USDC".into(),
                "USDT".into(),
                "DAI".into(),
            ],
            allowed_networks: vec![
                "ethereum".into(),
                "arbitrum".into(),
            ],
            trading: TradingRestrictions::default(),
            active_hours: None, // 24/7
            approval_threshold_usd: Some(50_000),
        }
    }
}

impl AgentPermissions {
    /// Create new permissions with specified level
    pub fn new(level: PermissionLevel) -> Self {
        Self {
            level,
            ..Default::default()
        }
    }

    /// Check if a trade is permitted
    pub fn can_execute_trade(
        &self,
        size_usd: u64,
        protocol: &str,
        token: &str,
        network: &str,
    ) -> Result<(), PermissionDenied> {
        // Check permission level
        if self.level == PermissionLevel::ReadOnly {
            return Err(PermissionDenied::ReadOnlyMode);
        }

        // Check trade size
        if size_usd > self.trading.max_trade_size_usd {
            return Err(PermissionDenied::ExceedsTradeLimit {
                requested: size_usd,
                max: self.trading.max_trade_size_usd,
            });
        }

        // Check protocol
        if !self.allowed_protocols.iter().any(|p| p.eq_ignore_ascii_case(protocol)) {
            return Err(PermissionDenied::ProtocolNotAllowed(protocol.to_string()));
        }

        // Check token
        if !self.allowed_tokens.iter().any(|t| t.eq_ignore_ascii_case(token)) {
            return Err(PermissionDenied::TokenNotAllowed(token.to_string()));
        }

        // Check network
        if !self.allowed_networks.iter().any(|n| n.eq_ignore_ascii_case(network)) {
            return Err(PermissionDenied::NetworkNotAllowed(network.to_string()));
        }

        // Check if approval required
        if let Some(threshold) = self.approval_threshold_usd {
            if size_usd > threshold {
                return Err(PermissionDenied::RequiresApproval {
                    amount: size_usd,
                    threshold,
                });
            }
        }

        Ok(())
    }

    /// Add a protocol to allowed list
    pub fn allow_protocol(&mut self, protocol: impl Into<String>) {
        let protocol = protocol.into();
        if !self.allowed_protocols.contains(&protocol) {
            self.allowed_protocols.push(protocol);
        }
    }

    /// Add a token to allowed list
    pub fn allow_token(&mut self, token: impl Into<String>) {
        let token = token.into();
        if !self.allowed_tokens.contains(&token) {
            self.allowed_tokens.push(token);
        }
    }

    /// Set active trading hours (UTC)
    pub fn set_active_hours(&mut self, start_hour: u8, end_hour: u8) {
        assert!(start_hour < 24 && end_hour < 24);
        self.active_hours = Some((start_hour, end_hour));
    }
}

/// Reasons for permission denial
#[derive(Debug, Clone, thiserror::Error)]
pub enum PermissionDenied {
    #[error("Agent is in read-only mode")]
    ReadOnlyMode,

    #[error("Trade size ${requested} exceeds limit of ${max}")]
    ExceedsTradeLimit { requested: u64, max: u64 },

    #[error("Protocol '{0}' is not allowed")]
    ProtocolNotAllowed(String),

    #[error("Token '{0}' is not allowed")]
    TokenNotAllowed(String),

    #[error("Network '{0}' is not allowed")]
    NetworkNotAllowed(String),

    #[error("Trade of ${amount} requires approval (threshold: ${threshold})")]
    RequiresApproval { amount: u64, threshold: u64 },

    #[error("Trading not allowed during current hours")]
    OutsideTradingHours,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_permissions() {
        let perms = AgentPermissions::default();
        assert_eq!(perms.level, PermissionLevel::Limited);
        assert!(perms.allowed_protocols.contains(&"uniswap".to_string()));
    }

    #[test]
    fn test_trade_permission_check() {
        let perms = AgentPermissions::default();
        
        // Should succeed
        assert!(perms.can_execute_trade(1000, "uniswap", "ETH", "ethereum").is_ok());
        
        // Should fail - exceeds limit
        assert!(perms.can_execute_trade(100_000, "uniswap", "ETH", "ethereum").is_err());
        
        // Should fail - protocol not allowed
        assert!(perms.can_execute_trade(1000, "unknown", "ETH", "ethereum").is_err());
    }
}

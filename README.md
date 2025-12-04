# Velvet Sentinel

## The Autonomous DeFi Intelligence Syndicate

[![NullShot Hacks](https://img.shields.io/badge/NullShot-Hacks%20S0-purple)](https://nullshot.ai)
[![Cortensor](https://img.shields.io/badge/Cortensor-Hackathon%203-blue)](https://cortensor.network)
[![Psy Protocol](https://img.shields.io/badge/Psy-Ascend%20Hack%202025-green)](https://psy.xyz)

---

## 🎯 Elevator Pitch

**Velvet Sentinel** is a decentralized network of specialized AI agents that form dynamic "syndicates" to execute DeFi strategies. Each agent runs in a Phala TEE, thinks via Cortensor's decentralized inference, speaks MCP (NullShot), and settles on Psy Protocol's high-TPS chain with ZK-verified track records.

> *"What if your DeFi position was managed by a syndicate of AI specialists who pay each other for insights, but you can verify their performance without seeing their secrets?"*

**The Innovation:** Agents don't just "chat"—they **buy and sell intelligence from each other** using x402 micropayments, creating a self-sustaining marketplace for alpha.

---

## 📚 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features by Layer](#-features-by-layer)
- [Agent Types](#-agent-types)
- [x402 Payment Protocol](#-x402-payment-protocol)
- [Syndicate Formation](#-syndicate-formation)
- [Use Cases](#-use-cases)
- [Hackathon Alignment](#-hackathon-alignment)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔴 Problem Statement

Current DeFi AI agents suffer from critical limitations:

| Problem | Impact |
|---------|--------|
| **Trust Deficit** | No way to verify agent decisions are made without tampering |
| **Payment Friction** | No standardized micropayment for AI inference in DeFi contexts |
| **Privacy Leakage** | Strategy exposure when using centralized inference |
| **Siloed Operations** | Agents can't discover, collaborate, or transact with each other |
| **Scalability Limits** | Can't handle high-frequency DeFi operations at scale |
| **Unverifiable Performance** | Users must trust claimed returns without cryptographic proof |

---

## ✅ Solution Overview

Velvet Sentinel addresses these challenges through a four-pillar architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                │
│                    (Web App published on NullShot)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         x402 PAYMENT GATEWAY                            │
│           (Micropayments for inference, execution, signals)             │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EDENLAYER DISCOVERY NETWORK                          │
│              (Agent discovery, capability matching)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NULLSHOT MCP ORCHESTRATION                           │
│           (Agent coordination, tool sharing, messaging)                 │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
│   CORTENSOR LAYER     │ │  PHALA dSTACK     │ │   PSY PROTOCOL        │
│                       │ │                   │ │                       │
│ • Decentralized LLM   │ │ • TEE Execution   │ │ • High-TPS Settlement │
│ • PoI Verification    │ │ • Key Management  │ │ • SDKey Identities    │
│ • PoUW Scoring        │ │ • Private Compute │ │ • ZK Proofs           │
│ • Evidence Bundles    │ │ • Attestation     │ │ • Cross-chain         │
└───────────────────────┘ └───────────────────┘ └───────────────────────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEFI PROTOCOL LAYER                             │
│     (DEXs, Lending, Bridges, Yield - via Thirdweb smart contracts)      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗 Architecture

### The Four Pillars

| Pillar | Technology | Role | Metaphor |
|--------|------------|------|----------|
| **Secure Execution** | Phala dStack | Private computation & key management | The Body |
| **Intelligent Inference** | Cortensor | Decentralized AI thinking & verification | The Brain |
| **Agent Communication** | NullShot MCP + Edenlayer | Discovery & interoperability | The Tongue |
| **Identity & Settlement** | Psy Protocol | ZK proofs & high-TPS transactions | The Reputation |

---

## 🛠 Tech Stack

### Complete Technology Matrix

| Layer | Technology | Purpose | Hackathon |
|-------|------------|---------|-----------|
| **Secure Compute** | Phala dStack | TEE-based agent execution | All |
| **Inference** | Cortensor Network | Decentralized LLM inference | Cortensor |
| **Verification** | Cortensor PoI/PoUW | Multi-node consensus & scoring | Cortensor |
| **Agent Framework** | NullShot TypeScript Framework | Agent logic structure | NullShot |
| **Interoperability** | Model Context Protocol (MCP) | Agent-to-agent communication | NullShot |
| **Discovery** | Edenlayer Protocol | Agent capability matching | NullShot |
| **Smart Contracts** | Thirdweb SDK | Wallet, AA, NFTs, revenue splits | NullShot |
| **Payments** | x402 Protocol | Pay-per-inference micropayments | Cortensor |
| **Identity** | Psy SDKeys | Programmable agent identities | Psy |
| **Privacy** | Psy ZK Proofs | Performance verification | Psy |
| **Scalability** | Psy PARTH | Million-TPS settlement | Psy |
| **Core Logic** | Rust | SDKey & ZK implementations | Psy |
| **Agent Logic** | TypeScript | Agent business logic | NullShot |
| **Dashboard** | Next.js | Observability UI | Cortensor |
| **Storage** | IPFS + Arweave | Evidence bundles & memory | All |

---

## 📦 Features by Layer

### Layer 1: Secure Execution (Phala dStack)

The foundation layer providing Trusted Execution Environment (TEE) capabilities.

#### Architecture

```
┌─────────────────────────────────────────┐
│           PHALA dSTACK WORKER           │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │     AGENT ENCLAVE (SGX/TDX)     │    │
│  ├─────────────────────────────────┤    │
│  │ • Wallet KeyPair                │    │
│  │ • Strategy Parameters           │    │
│  │ • Position State                │    │
│  │ • x402 Payment Signing          │    │
│  │ • MCP Message Encryption        │    │
│  └─────────────────────────────────┘    │
│                  │                      │
│                  ▼                      │
│  ┌─────────────────────────────────┐    │
│  │    ATTESTATION SERVICE          │    │
│  │    (Remote Attestation Report)  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

#### Features

| Feature | Description |
|---------|-------------|
| **Private Key Management** | Agent wallets never leave the enclave |
| **Strategy Protection** | Proprietary trading logic remains secret |
| **Position Privacy** | Current positions invisible to node operators |
| **Secure Signing** | x402 payments signed within TEE |
| **Remote Attestation** | Cryptographic proof of enclave integrity |
| **Secret Storage** | Phala's native secret management |

#### Implementation Details

- **SDK**: `@phala/dstack-sdk` for enclave operations
- **Attestation**: Reports published to IPFS, hash stored on-chain
- **Key Derivation**: Hierarchical deterministic keys within enclave
- **Communication**: Encrypted channels between enclaves

---

### Layer 2: Intelligent Inference (Cortensor)

The cognitive layer providing decentralized AI capabilities with verification.

#### Core Integration Points

| Cortensor Feature | Implementation |
|-------------------|----------------|
| **Sessions** | Persistent inference sessions per agent |
| **PoI (Proof of Inference)** | 3-of-5 node consensus for critical decisions |
| **PoUW Validators** | Quality scoring for inference providers |
| **Evidence Bundles** | JSON bundles stored on IPFS for auditability |
| **Router v1 + /validate** | Custom validation for strategy compliance |

#### Inference Request Categories

```
┌────────────────────────────────────────────────────────────┐
│                    INFERENCE REQUEST TYPES                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. MARKET ANALYSIS (Multi-node PoI required)              │
│     └─ "Analyze ETH/USDC 4h chart for breakout signals"    │
│     └─ Consensus: 3/5 nodes must agree                     │
│     └─ Cost: Higher (multiple inference calls)             │
│                                                            │
│  2. SENTIMENT SCORING (Single node + validator)            │
│     └─ "Score Twitter sentiment for $ARB: -100 to +100"    │
│     └─ Validation: PoUW scorer verifies range/format       │
│     └─ Cost: Medium                                        │
│                                                            │
│  3. RISK ASSESSMENT (Multi-node + deterministic check)     │
│     └─ "Evaluate liquidation risk given position X"        │
│     └─ Validation: Deterministic policy tests              │
│     └─ Cost: Higher                                        │
│                                                            │
│  4. STRATEGY COMPLIANCE (Validator-only)                   │
│     └─ "Does proposed trade violate risk parameters?"      │
│     └─ Validation: Rubric-driven scoring                   │
│     └─ Cost: Low                                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### Evidence Bundle Schema

```json
{
  "bundle_id": "uuid-v4",
  "timestamp": "2025-12-04T10:30:00Z",
  "agent_id": "SDKey_identifier",
  "request": {
    "type": "MARKET_ANALYSIS",
    "query_hash": "sha256(prompt)",
    "parameters": {
      "token_pair": "ETH/USDC",
      "timeframe": "4h",
      "indicators": ["RSI", "MACD", "Volume"]
    }
  },
  "response": {
    "response_hash": "sha256(response)",
    "summary": "Bullish breakout signal detected",
    "confidence": 0.87
  },
  "verification": {
    "poi_consensus": true,
    "nodes_queried": 5,
    "nodes_agreed": 4,
    "node_attestations": [
      {"node_id": "cortensor-node-1", "signature": "0x...", "score": 0.95},
      {"node_id": "cortensor-node-2", "signature": "0x...", "score": 0.92},
      {"node_id": "cortensor-node-3", "signature": "0x...", "score": 0.89},
      {"node_id": "cortensor-node-4", "signature": "0x...", "score": 0.91}
    ]
  },
  "storage": {
    "ipfs_cid": "QmXyz...",
    "arweave_tx": "ar://..."
  }
}
```

#### Memory & Knowledge Layer

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTED AGENT MEMORY                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SHORT-TERM (Session)              LONG-TERM (Persistent)             │
│   ┌─────────────────────┐           ┌─────────────────────────┐        │
│   │ • Current market    │           │ • Historical trade      │        │
│   │   context           │           │   patterns (encrypted)  │        │
│   │ • Active positions  │           │ • User preferences      │        │
│   │ • Recent signals    │           │ • Strategy performance  │        │
│   │ • Pending decisions │           │ • Learned correlations  │        │
│   └─────────────────────┘           └─────────────────────────┘        │
│              │                                │                         │
│              └────────────┬───────────────────┘                         │
│                           ▼                                             │
│                  ┌─────────────────┐                                    │
│                  │   RAG LAYER     │                                    │
│                  │ (Cortensor      │                                    │
│                  │  Inference)     │                                    │
│                  └─────────────────┘                                    │
│                                                                         │
│   Storage: IPFS (encrypted) + Arweave (permanent)                      │
│   Embeddings: Computed via Cortensor, stored in TEE                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Layer 3: Agent Communication & Discovery (NullShot + Edenlayer)

The interoperability layer enabling agent-to-agent collaboration.

#### MCP (Model Context Protocol) Implementation

Each agent exposes standardized MCP tools for discovery and interaction:

```typescript
// Agent Capability Manifest (MCP-compliant)
{
  "agent_id": "velvet-sentinel://whale-watcher-001",
  "name": "Whale Watcher Alpha",
  "version": "1.0.0",
  "description": "Monitors on-chain whale movements for trading signals",
  
  "tools": [
    {
      "name": "get_whale_movements",
      "description": "Returns significant wallet movements in last N hours",
      "parameters": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string",
            "description": "Token symbol (e.g., ETH, USDC)"
          },
          "threshold_usd": {
            "type": "number",
            "description": "Minimum movement size in USD"
          },
          "hours": {
            "type": "number",
            "description": "Lookback period in hours"
          }
        },
        "required": ["token", "threshold_usd"]
      },
      "pricing": {
        "protocol": "x402",
        "amount": "0.001",
        "currency": "ETH"
      }
    },
    {
      "name": "subscribe_whale_alerts",
      "description": "Real-time alerts for whale activity",
      "pricing": {
        "protocol": "x402",
        "amount": "0.0001",
        "currency": "ETH",
        "per": "alert"
      }
    },
    {
      "name": "get_wallet_history",
      "description": "Historical analysis of specific wallet",
      "parameters": {
        "type": "object",
        "properties": {
          "wallet_address": {"type": "string"},
          "days": {"type": "number"}
        },
        "required": ["wallet_address"]
      },
      "pricing": {
        "protocol": "x402",
        "amount": "0.005",
        "currency": "ETH"
      }
    }
  ],
  
  "resources": [
    {
      "name": "whale_leaderboard",
      "description": "Top 100 whale wallets by activity",
      "uri": "velvet-sentinel://whale-watcher-001/resources/leaderboard",
      "mimeType": "application/json"
    }
  ],
  
  "attestation": {
    "phala_report_cid": "QmPhala...",
    "psy_sdkey": "0x1234...5678",
    "cortensor_reputation": 0.92,
    "verified_since": "2025-01-15T00:00:00Z"
  }
}
```

#### Edenlayer Discovery Protocol

Agents register and discover each other through Edenlayer:

```typescript
// Discovery Query Example
const discoveryQuery = {
  capabilities: ["sentiment_analysis", "market_data"],
  requirements: {
    min_reputation: 0.85,
    max_price_per_call: "0.005 ETH",
    required_attestations: ["phala_tee", "cortensor_poi"]
  },
  preferences: {
    latency: "low",
    consensus: "multi_node"
  }
};

// Discovery Response
const matchedAgents = [
  {
    agent_id: "velvet-sentinel://sentiment-analyst-003",
    match_score: 0.94,
    capabilities: ["sentiment_analysis", "social_monitoring"],
    pricing: "0.002 ETH per analysis",
    reputation: 0.91,
    attestations: ["phala_tee", "cortensor_poi", "psy_sdkey"]
  },
  // ... more matches
];
```

#### Thirdweb Integration

| Feature | Implementation |
|---------|----------------|
| **Account Abstraction** | Gasless transactions for end users |
| **NFT Agent Licenses** | Ownership/revenue rights as NFTs |
| **Revenue Splits** | Automatic earnings distribution |
| **Smart Wallets** | Agent-controlled treasury management |

---

### Layer 4: Identity, Verification & Settlement (Psy Protocol)

The trust and scalability layer providing cryptographic guarantees.

#### SDKey Implementation (Rust)

```rust
/// Agent Identity using Psy Protocol SDKeys
pub struct AgentSDKey {
    /// Unique identifier derived from public key
    pub id: [u8; 32],
    
    /// Permissions governing agent behavior
    pub permissions: AgentPermissions,
    
    /// Historical performance proofs
    pub performance_proofs: Vec<PerformanceProof>,
    
    /// External attestations (Phala, Cortensor)
    pub attestations: Vec<Attestation>,
    
    /// Delegation chain for sub-agents
    pub delegations: Vec<Delegation>,
}

/// Fine-grained permission controls
pub struct AgentPermissions {
    /// Maximum single trade size in USD
    pub max_trade_size_usd: u64,
    
    /// Whitelisted protocols (Uniswap, Aave, etc.)
    pub allowed_protocols: Vec<ProtocolId>,
    
    /// Whitelisted tokens
    pub allowed_tokens: Vec<TokenId>,
    
    /// Maximum daily loss (basis points, e.g., 500 = 5%)
    pub daily_loss_limit_bps: u16,
    
    /// Leverage permissions
    pub can_use_leverage: bool,
    pub max_leverage: u8,
    
    /// Time-based restrictions
    pub active_hours: Option<TimeRange>,
    
    /// Requires human approval above threshold
    pub approval_threshold_usd: Option<u64>,
}

/// Zero-Knowledge Performance Proof
pub struct PerformanceProof {
    /// Proof period
    pub period_start: u64,
    pub period_end: u64,
    
    /// ZK Proofs (proves claims without revealing trades)
    pub pnl_proof: ZkProof,           // "I made >X% return"
    pub sharpe_ratio_proof: ZkProof,  // "My Sharpe ratio is >Y"
    pub max_drawdown_proof: ZkProof,  // "Max drawdown was <Z%"
    pub trade_count_proof: ZkProof,   // "I executed N trades"
    
    /// On-chain verification
    pub verification_tx: TxHash,
    pub verified_at: u64,
}

/// External attestation from other systems
pub struct Attestation {
    pub source: AttestationSource,  // Phala, Cortensor, etc.
    pub attestation_type: String,
    pub data_hash: [u8; 32],
    pub signature: Signature,
    pub expires_at: Option<u64>,
}

pub enum AttestationSource {
    PhalaTEE { enclave_id: [u8; 32] },
    CortensorPoI { node_ids: Vec<String> },
    CortensorPoUW { validator_id: String, score: f64 },
    ThirdParty { provider: String },
}
```

#### ZK Performance Proofs

What agents can prove **without** revealing:

| Proves | Without Revealing |
|--------|-------------------|
| "I achieved >15% APY this month" | Which tokens were traded |
| "My Sharpe ratio exceeds 2.0" | Position sizes |
| "Maximum drawdown was <10%" | Entry/exit points |
| "I executed 50+ trades" | Counterparties |
| "I stayed within risk limits" | Actual limit values |

#### High-TPS Settlement

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PSY PROTOCOL SETTLEMENT                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   PARTH ARCHITECTURE                                                    │
│   ├── Parallel Transaction Processing                                  │
│   ├── Sharded State Management                                         │
│   └── Sub-second Finality                                              │
│                                                                         │
│   SETTLEMENT TYPES:                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │ x402 PAYMENTS   │  │ TRADE EXECUTION │  │ ZK PROOF SUBMIT │        │
│   │                 │  │                 │  │                 │        │
│   │ Agent-to-agent  │  │ DEX swaps       │  │ Performance     │        │
│   │ micropayments   │  │ Lending actions │  │ attestations    │        │
│   │                 │  │ Yield deposits  │  │                 │        │
│   │ ~1000 TPS       │  │ ~5000 TPS       │  │ ~500 TPS        │        │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💸 x402 Payment Protocol

The economic backbone enabling the agent marketplace.

### Payment Flow

```
     REQUESTER AGENT                              PROVIDER AGENT
     (Fund Manager)                               (Sentiment Analyst)
           │                                             │
           │  1. MCP Discovery: "Who has sentiment?"     │
           │─────────────────────────────────────────────▶
           │                                             │
           │  2. Capability Response + x402 Pricing      │
           │◀─────────────────────────────────────────────
           │     { tool: "analyze_sentiment",            │
           │       price: "0.002 ETH",                   │
           │       payment_address: "0x...",             │
           │       x402_endpoint: "/pay" }               │
           │                                             │
           │  3. Request: analyze_sentiment("$ETH")      │
           │─────────────────────────────────────────────▶
           │                                             │
           │  4. HTTP 402 Payment Required               │
           │◀─────────────────────────────────────────────
           │     { payment_hash: "0x...",                │
           │       amount: "0.002 ETH",                  │
           │       expires: "timestamp",                 │
           │       payment_methods: ["psy", "eth"] }     │
           │                                             │
           │  5. Payment Tx (Psy Protocol - instant)     │
           │─────────────────────────────────────────────▶
           │                                             │
           │  6. Payment Confirmed + Inference Begins    │
           │     (Routed through Cortensor)              │
           │                                             │
           │  7. Response + Evidence Bundle              │
           │◀─────────────────────────────────────────────
           │     { sentiment: 0.73,                      │
           │       confidence: 0.89,                     │
           │       evidence_bundle_cid: "Qm...",         │
           │       poi_attestations: [...] }             │
           │                                             │
```

### Pricing Models

| Service Type | Payment Model | Example Rate |
|--------------|---------------|--------------|
| **One-time Query** | Pay-per-call | 0.001-0.01 ETH |
| **Subscription** | Time-based | 0.1 ETH/day |
| **Alert Stream** | Pay-per-event | 0.0001 ETH/alert |
| **Execution** | Success fee | 0.1% of profit |
| **Priority Access** | Premium tier | 2x base rate |

### Payment Protocol Specification

```typescript
interface X402PaymentRequest {
  // Unique payment identifier
  payment_id: string;
  
  // Amount and currency
  amount: string;
  currency: "ETH" | "USDC" | "COR" | "PSY";
  
  // Recipient
  recipient_address: string;
  recipient_agent_id: string;
  
  // Service details
  service: {
    tool_name: string;
    parameters_hash: string;
    expected_response_type: string;
  };
  
  // Timing
  expires_at: number;
  
  // Settlement options
  settlement_chains: ("psy" | "ethereum" | "arbitrum")[];
  
  // Escrow (optional)
  escrow?: {
    enabled: boolean;
    release_conditions: string[];
    dispute_resolver: string;
  };
}

interface X402PaymentResponse {
  payment_id: string;
  status: "confirmed" | "pending" | "failed";
  tx_hash: string;
  settlement_chain: string;
  confirmed_at: number;
  
  // Service delivery
  service_response?: any;
  evidence_bundle_cid?: string;
}
```

---

## 🤖 Agent Types

### Agent 1: Whale Watcher

**Purpose:** Monitors on-chain large wallet movements

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WHALE WATCHER AGENT                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   DATA SOURCES                        PROCESSING                        │
│   ├── Ethereum Mempool               ├── Pattern Recognition           │
│   ├── DEX Trade Logs                 │   (Cortensor Inference)         │
│   ├── Bridge Transactions            ├── Anomaly Detection             │
│   └── CEX Deposit/Withdraw           └── Signal Generation             │
│                                                                         │
│   TIERS:                                                                │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ FREE (Public Good)           │ PREMIUM (x402)                   │  │
│   ├──────────────────────────────┼──────────────────────────────────┤  │
│   │ • Daily summary              │ • Real-time alerts               │  │
│   │ • Top 10 movements           │ • Specific wallet tracking       │  │
│   │ • 24h delay                  │ • Historical patterns            │  │
│   │                              │ • Predictive signals             │  │
│   └──────────────────────────────┴──────────────────────────────────┘  │
│                                                                         │
│   PRICING:                                                              │
│   • Real-time alert: 0.0001 ETH/alert                                  │
│   • Wallet tracking: 0.001 ETH/wallet/day                              │
│   • Pattern report: 0.005 ETH/report                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Agent 2: Sentiment Oracle

**Purpose:** Aggregates and analyzes social/market sentiment

| Data Source | Analysis Type | Update Frequency |
|-------------|---------------|------------------|
| Twitter/X | NLP sentiment | Real-time |
| Discord | Community mood | Hourly |
| Telegram | Alpha signals | Real-time |
| Governance Forums | Proposal sentiment | Daily |
| News APIs | Macro sentiment | Hourly |

**Inference Flow:**
1. Raw data collected in TEE (privacy preserved)
2. Sent to Cortensor for multi-node sentiment analysis
3. PoI ensures consensus on sentiment score
4. Evidence bundle published to IPFS
5. Response delivered via x402 payment

### Agent 3: Risk Guardian

**Purpose:** Monitors positions and prevents liquidations

**Capabilities:**
- Health factor monitoring across lending protocols
- Predictive liquidation warnings (via Cortensor inference)
- Automated deleveraging execution
- Cross-protocol risk aggregation

**Trust Model:**
- Runs in Phala TEE (user keys never exposed)
- Psy ZK proof: "Protected $X in capital this month"
- SDKey permissions limit max trade size
- Evidence trail for all protective actions

### Agent 4: Arbitrage Hunter

**Purpose:** Identifies and executes cross-DEX arbitrage

**Why TEE is Essential:**
- Arbitrage opportunities are MEV-sensitive
- Strategy logic must remain private
- Execution must be atomic

**Psy Protocol Value:**
- High-TPS for rapid execution
- Cross-chain via Psy's infrastructure
- ZK proofs of profitability

### Agent 5: Yield Optimizer

**Purpose:** Maximizes yield across DeFi protocols

**Strategy Components:**
- APY tracking across protocols
- Gas-optimized rebalancing
- Risk-adjusted returns calculation
- Auto-compounding logic

### Agent 6: Coordinator (Fund Manager)

**Purpose:** Orchestrates syndicates of specialized agents

**Responsibilities:**
- Syndicate formation based on strategy needs
- Budget allocation across agent payments
- Decision aggregation from multiple sources
- Execution coordination
- Performance tracking and reporting

---

## 🕸 Syndicate Formation

The unique mechanism enabling multi-agent collaboration.

### Syndicate Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXAMPLE SYNDICATE: "ETH Momentum Play"               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐               │
│   │   WHALE      │   │  SENTIMENT   │   │   TECHNICAL  │               │
│   │   WATCHER    │   │   ANALYST    │   │   ANALYST    │               │
│   │   Agent      │   │   Agent      │   │   Agent      │               │
│   │              │   │              │   │              │               │
│   │ Reputation:  │   │ Reputation:  │   │ Reputation:  │               │
│   │ 0.94         │   │ 0.91         │   │ 0.88         │               │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘               │
│          │                  │                  │                        │
│          │ $0.001 ETH       │ $0.002 ETH       │ $0.0015 ETH           │
│          │ per alert        │ per analysis     │ per signal            │
│          │                  │                  │                        │
│          └─────────────────┼──────────────────┘                        │
│                            │                                            │
│                            ▼                                            │
│                  ┌──────────────────┐                                   │
│                  │    COORDINATOR   │                                   │
│                  │      AGENT       │                                   │
│                  │  (Fund Manager)  │                                   │
│                  │                  │                                   │
│                  │ Decision Logic:  │                                   │
│                  │ Weighted voting  │                                   │
│                  │ by reputation    │                                   │
│                  └────────┬─────────┘                                   │
│                           │                                             │
│                           ▼                                             │
│                  ┌──────────────────┐                                   │
│                  │   USER VAULTS    │                                   │
│                  │  (Smart Contract │                                   │
│                  │   via Thirdweb)  │                                   │
│                  └──────────────────┘                                   │
│                                                                         │
│   REVENUE DISTRIBUTION (Thirdweb Split Contract):                      │
│   ├── Coordinator: 40%                                                 │
│   ├── Whale Watcher: 20%                                               │
│   ├── Sentiment Analyst: 20%                                           │
│   └── Technical Analyst: 20%                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Syndicate Formation Process

```typescript
interface SyndicateFormation {
  // Step 1: Strategy Definition
  strategy: {
    name: "ETH Momentum Play";
    objective: "Capture ETH price momentum with multi-signal confirmation";
    risk_profile: "moderate";
    target_return: "15-25% APY";
  };
  
  // Step 2: Capability Requirements
  required_capabilities: [
    { type: "whale_monitoring", weight: 0.3 },
    { type: "sentiment_analysis", weight: 0.3 },
    { type: "technical_analysis", weight: 0.25 },
    { type: "execution", weight: 0.15 }
  ];
  
  // Step 3: Agent Discovery (via Edenlayer)
  discovery_criteria: {
    min_reputation: 0.85,
    required_attestations: ["phala_tee", "cortensor_poi"],
    max_latency_ms: 500,
    price_budget_per_signal: "0.01 ETH"
  };
  
  // Step 4: Contract Deployment (via Thirdweb)
  contracts: {
    vault: "SyndicateVault.sol",
    revenue_split: "RevenueSplitter.sol",
    governance: "SyndicateGovernance.sol"
  };
  
  // Step 5: Operational Parameters
  operations: {
    decision_threshold: 0.7,  // 70% weighted agreement to act
    rebalance_frequency: "4h",
    max_position_size: "10% of vault",
    stop_loss: "5% drawdown"
  };
}
```

---

## 📊 Observability Dashboard

Real-time monitoring for the entire system (Cortensor requirement).

### Metrics Categories

| Category | Metrics |
|----------|---------|
| **Inference** | Latency P50/P95/P99, Success rate, PoI consensus rate, Cost per inference |
| **Agents** | Active count, Syndicate formations, Revenue generated, Reputation scores |
| **Payments** | x402 volume, Average payment size, Settlement time, Failed payments |
| **DeFi** | TVL managed, Trades executed, Aggregate PnL, Gas spent |
| **Network** | Cortensor node health, Phala enclave status, Psy block times |

### Dashboard Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      VELVET SENTINEL DASHBOARD                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   SYSTEM HEALTH         │  │   INFERENCE METRICS                 │  │
│  │   ○ Cortensor: Online   │  │   ┌─────────────────────────────┐   │  │
│  │   ○ Phala: 12 Enclaves  │  │   │ Latency Distribution        │   │  │
│  │   ○ Psy: 1.2s blocks    │  │   │ [     ████████░░░░  ]       │   │  │
│  │   ○ Agents: 47 Active   │  │   │ P50: 120ms | P99: 890ms     │   │  │
│  └─────────────────────────┘  │   └─────────────────────────────┘   │  │
│                               │   PoI Consensus Rate: 94.2%          │  │
│  ┌─────────────────────────┐  │   PoUW Avg Score: 0.89               │  │
│  │   x402 PAYMENTS (24h)   │  └─────────────────────────────────────┘  │
│  │   Volume: 12.4 ETH      │                                           │
│  │   Transactions: 8,421   │  ┌─────────────────────────────────────┐  │
│  │   Avg Size: 0.0015 ETH  │  │   AGENT LEADERBOARD                 │  │
│  │   Settlement: <2s       │  │   1. whale-watcher-001  ★ 0.96      │  │
│  └─────────────────────────┘  │   2. sentiment-003      ★ 0.94      │  │
│                               │   3. risk-guardian-007  ★ 0.92      │  │
│  ┌─────────────────────────┐  │   4. arb-hunter-012     ★ 0.91      │  │
│  │   DEFI PERFORMANCE      │  │   5. yield-opt-002      ★ 0.89      │  │
│  │   TVL: $2.4M            │  └─────────────────────────────────────┘  │
│  │   24h Trades: 342       │                                           │
│  │   24h PnL: +$12,450     │  ┌─────────────────────────────────────┐  │
│  │   Active Syndicates: 8  │  │   EVIDENCE BUNDLES                  │  │
│  └─────────────────────────┘  │   Recent: 1,247 bundles (24h)       │  │
│                               │   IPFS Pins: 12,893 total            │  │
│                               │   Avg Bundle Size: 2.3 KB            │  │
│                               └─────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### Use Case 1: Autonomous Yield Farming

```
User Journey:
1. User connects wallet via Thirdweb
2. Deposits USDC into "Stable Yield" vault
3. Coordinator agent forms syndicate:
   - Yield Optimizer (finds opportunities)
   - Risk Guardian (monitors health)
   - Sentiment Analyst (protocol risk signals)
4. Syndicate autonomously:
   - Allocates across Aave, Compound, Curve
   - Rebalances based on APY changes
   - Exits positions on negative sentiment
5. User sees:
   - Real-time dashboard
   - ZK-proven performance history
   - Evidence bundles for all decisions
```

### Use Case 2: Liquidation Protection

```
User Journey:
1. User has leveraged position on Aave
2. Deploys Risk Guardian agent
3. Agent monitors:
   - Health factor in real-time
   - Price feeds via Cortensor consensus
   - Whale movements that might impact price
4. On risk detection:
   - Agent triggers partial deleverage
   - All actions logged with evidence bundles
   - User notified with ZK proof of protection
```

### Use Case 3: DAO Treasury Management

```
DAO Journey:
1. DAO votes to deploy treasury management syndicate
2. SDKey permissions set by governance:
   - Max 10% in any single position
   - Only blue-chip tokens
   - Max 2x leverage
3. Syndicate operates autonomously within constraints
4. Monthly ZK performance reports to DAO
5. Any member can verify compliance via evidence bundles
```

---

## 🏆 Hackathon Alignment

### NullShot Hacks: Season 0

| Requirement | How We Address |
|-------------|----------------|
| **MCP Implementation** | Full MCP manifest for all agents |
| **NullShot Framework** | TypeScript agents built on framework |
| **Thirdweb Integration** | Wallets, NFTs, revenue splits |
| **Agentic Economy** | x402 agent-to-agent payments |
| **Web App on Platform** | Dashboard published on NullShot |
| **Demo Video** | 3-5 min comprehensive demo |
| **Tagged Submission** | "Nullshot Hacks S0" |

**Target Tracks:**
- Track 1a: MCPs/Agents using NullShot Framework
- Track 1b: Web app published via NullShot Platform
- Community Choice Award

---

### Cortensor Hackathon #3

| Requirement | How We Address |
|-------------|----------------|
| **Agentic Applications** | Autonomous DeFi agents |
| **PoI/PoUW Utilization** | Multi-node consensus for critical decisions |
| **Validation & Attestations** | Evidence bundles for all decisions |
| **x402 Integration** | Core to our payment model |
| **Public Goods** | Free tier whale watcher |
| **Observability** | Full dashboard implementation |
| **Working Demo** | Live Discord demonstration |

**Stretch Goals Addressed:**
- ✅ ERC-8004: Agent identity artifacts
- ✅ x402: Pay-per-call rails (core feature)
- ✅ Router v1 /validate: Strategy compliance checks

**Scoring Alignment:**
- Functionality & Stability: 25% ✓
- Cortensor Integration: 25% ✓
- Originality & Technical Depth: 20% ✓
- Usability & Demo Quality: 20% ✓
- Public Good Impact: 10% ✓

---

### Psy Protocol: Ascend Hack 2025

| Requirement | How We Address |
|-------------|----------------|
| **Rust Core** | SDKey management, ZK proofs in Rust |
| **SDKeys** | Programmable agent identities |
| **Scalability** | PARTH for high-TPS settlement |
| **Privacy** | ZK performance proofs |
| **Security** | TEE + ZK combination |
| **Demo Video** | ≤3 minutes |
| **GitHub Repo** | Public with README |

**Track Alignment:**
- Apps: Wallet/DeFi agents ✓
- Protocol Layer: Identity + privacy ✓
- Explorations: AI × identity ✓

---

## 📁 Repository Structure

```
velvet-sentinel/
├── README.md                        # This file
├── LICENSE                          # MIT License
│
├── crates/                          # Rust components (Psy Protocol)
│   ├── sdkey-manager/               # SDKey identity management
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── identity.rs
│   │   │   ├── permissions.rs
│   │   │   └── delegation.rs
│   │   └── Cargo.toml
│   ├── zk-proofs/                   # Performance proof generation
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── performance.rs
│   │   │   ├── compliance.rs
│   │   │   └── circuits/
│   │   └── Cargo.toml
│   └── psy-integration/             # Psy Protocol client
│       ├── src/
│       └── Cargo.toml
│
├── agents/                          # TypeScript agents (NullShot)
│   ├── whale-watcher/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── monitors/
│   │   │   ├── analysis/
│   │   │   └── alerts/
│   │   ├── mcp-manifest.json
│   │   ├── package.json
│   │   └── README.md
│   ├── sentiment-analyst/
│   │   ├── src/
│   │   ├── mcp-manifest.json
│   │   └── package.json
│   ├── risk-guardian/
│   │   ├── src/
│   │   ├── mcp-manifest.json
│   │   └── package.json
│   ├── arb-hunter/
│   │   ├── src/
│   │   ├── mcp-manifest.json
│   │   └── package.json
│   ├── yield-optimizer/
│   │   ├── src/
│   │   ├── mcp-manifest.json
│   │   └── package.json
│   └── coordinator/
│       ├── src/
│       │   ├── index.ts
│       │   ├── syndicate/
│       │   ├── decision/
│       │   └── execution/
│       ├── mcp-manifest.json
│       └── package.json
│
├── packages/                        # Shared packages
│   ├── cortensor-client/            # Cortensor integration
│   │   ├── src/
│   │   │   ├── session.ts
│   │   │   ├── inference.ts
│   │   │   ├── poi.ts
│   │   │   └── evidence.ts
│   │   └── package.json
│   ├── x402-payments/               # Payment protocol
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── types.ts
│   │   │   └── settlement.ts
│   │   └── package.json
│   ├── phala-enclave/               # dStack utilities
│   │   ├── src/
│   │   │   ├── worker.ts
│   │   │   ├── attestation.ts
│   │   │   └── secrets.ts
│   │   └── package.json
│   ├── mcp-utils/                   # MCP helpers
│   │   ├── src/
│   │   └── package.json
│   └── shared-types/                # Common TypeScript types
│       ├── src/
│       └── package.json
│
├── contracts/                       # Thirdweb smart contracts
│   ├── src/
│   │   ├── AgentRegistry.sol
│   │   ├── SyndicateVault.sol
│   │   ├── RevenueSplitter.sol
│   │   └── AgentLicense.sol
│   ├── test/
│   ├── scripts/
│   └── hardhat.config.ts
│
├── dashboard/                       # Observability UI (Next.js)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
│
├── docs/                            # Documentation
│   ├── architecture.md
│   ├── api-reference.md
│   ├── deployment-guide.md
│   ├── nullshot-submission.md
│   ├── cortensor-submission.md
│   └── psy-submission.md
│
├── demo/                            # Demo materials
│   ├── scripts/
│   ├── nullshot-demo.mp4
│   ├── cortensor-demo.mp4
│   └── psy-demo.mp4
│
├── docker/                          # Container configs
│   ├── phala-worker/
│   └── docker-compose.yml
│
└── .github/
    └── workflows/
        ├── test.yml
        └── deploy.yml
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Docker & Docker Compose
- Phala dStack CLI
- Access to Cortensor testnet
- Psy Protocol testnet tokens

### Installation

```bash
# Clone repository
git clone https://github.com/velvet-sentinel/velvet-sentinel.git
cd velvet-sentinel

# Install dependencies
npm install

# Build Rust crates
cd crates && cargo build --release

# Configure environment
cp .env.example .env
# Edit .env with your API keys and endpoints

# Start local development
docker-compose up -d
npm run dev
```

### Running Agents

```bash
# Start whale watcher agent
cd agents/whale-watcher
npm run start

# Start coordinator with syndicate
cd agents/coordinator
npm run start -- --syndicate="eth-momentum"
```

### Deploying Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network psy-testnet
```

---

## 📅 Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Phala dStack worker setup
- [ ] NullShot framework integration
- [ ] Cortensor session management
- [ ] Basic x402 payment flow

### Phase 2: Core Agents (Week 3-4)
- [ ] Whale Watcher agent (public good + premium)
- [ ] Sentiment Analyst agent
- [ ] Agent-to-agent payment working
- [ ] Psy SDKey implementation (Rust)

### Phase 3: Syndicate Logic (Week 5)
- [ ] Coordinator agent
- [ ] Multi-agent orchestration
- [ ] Revenue splitting contracts
- [ ] ZK performance proofs

### Phase 4: Polish & Demo (Week 6)
- [ ] Observability dashboard
- [ ] Documentation
- [ ] Demo videos
- [ ] Hackathon submissions

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Run tests
npm run test
cargo test

# Lint
npm run lint
cargo clippy

# Format
npm run format
cargo fmt
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **NullShot**: https://nullshot.ai
- **Edenlayer**: https://edenlayer.com
- **Cortensor**: https://cortensor.network
- **Psy Protocol**: https://psy.xyz
- **Thirdweb**: https://thirdweb.com
- **Phala Network**: https://phala.network

---

## 📞 Contact

- Discord: [Join our server](#)
- Twitter: [@VelvetSentinel](#)
- Email: team@velvetsentinel.ai

---

*Built with ❤️ for the Agentic Economy*

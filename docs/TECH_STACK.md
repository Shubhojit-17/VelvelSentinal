# Velvet Sentinel - Complete Tech Stack Documentation

## 📚 Table of Contents

- [Overview](#overview)
- [Hackathon Requirements](#hackathon-requirements)
- [Core Technologies](#core-technologies)
  - [NullShot Framework](#1-nullshot-framework)
  - [Edenlayer Protocol](#2-edenlayer-protocol)
  - [Thirdweb](#3-thirdweb)
  - [Cortensor Network](#4-cortensor-network)
  - [Phala dStack](#5-phala-dstack)
  - [Psy Protocol](#6-psy-protocol)
  - [x402 Payment Protocol](#7-x402-payment-protocol)
- [Development Stack](#development-stack)
- [Documentation Links](#documentation-links)
- [Integration Matrix](#integration-matrix)

---

## Overview

Velvet Sentinel integrates technologies from three hackathons into a unified platform for decentralized AI agents in DeFi. This document provides comprehensive details on each technology, its features, and relevant documentation links.

---

## Hackathon Requirements

### 🟣 NullShot Hacks: Season 0

| Requirement | Details | Documentation |
|-------------|---------|---------------|
| **Prize Pool** | $30,000 USD | [Hackathon Details](https://dorahacks.io/hackathon/nullshothacks/detail) |
| **Framework** | NullShot TypeScript Agent Framework | [GitHub Repository](https://github.com/null-shot/typescript-agent-framework) |
| **Protocol** | Model Context Protocol (MCP) | [MCP Specification](https://nullshot.ai/en/docs/developers/mcp-framework/overview) |
| **Sponsor Tech** | Thirdweb Infrastructure | [Thirdweb Docs](https://portal.thirdweb.com/) |
| **Submission** | Tag "Nullshot Hacks S0" on Brainstorm | [NullShot Platform](https://nullshot.ai/) |

**Track Options:**
- **Track 1a**: MCPs/Agents using NullShot Framework ($5,000 × 4 winners)
- **Track 1b**: Web app published via NullShot ($5,000 × 4 winners)
- **Track 2**: MCPs/Agents using other frameworks ($2,000 × 4 winners)
- **Community Choice**: $2,000 × 1 winner

---

### 🔵 Cortensor Hackathon #3

| Requirement | Details | Documentation |
|-------------|---------|---------------|
| **Prize Pool** | $3,000+ in $COR equivalent | [Hackathon Details](https://dorahacks.io/hackathon/1768/detail) |
| **Focus Areas** | Agentic Apps, PoI/PoUW, Validation, Tooling | [Cortensor Docs](https://docs.cortensor.network/) |
| **Deadline** | January 4, 2026 | [Discord](https://discord.gg/cortensor) |
| **Submission** | Public repo + Live demo in Discord | [Community Projects](https://github.com/cortensor/community-projects) |

**Primary Focus Areas:**
- Agentic Applications (autonomous assistants)
- PoI/PoUW Utilization (redundant inference, validator scoring)
- Validation & Attestations (evidence bundles, on-chain records)
- Developer Tooling & SDKs
- Public Goods / Free Inferencing
- Observability Dashboards

**Stretch Goals (Bonus Points):**
- ERC-8004: Agent identity/validation artifacts
- x402: Pay-per-call rails
- Router v1 with /validate endpoint
- MCP integration

---

### 🟢 Psy Protocol: Ascend Hack 2025

| Requirement | Details | Documentation |
|-------------|---------|---------------|
| **Prize Pool** | $9,000+ USD + Hardware | [Hackathon Details](https://dorahacks.io/hackathon/1511/detail) |
| **Core Language** | Rust (mandatory) | [Rust Tutorial](https://www.runoob.com/rust/rust-tutorial.html) |
| **Key Features** | SDKeys, PARTH, ZK Proofs, PoW 2.0 | [Psy Docs](https://psy.xyz/docs) |
| **Demo Video** | ≤3 minutes | Required |

**Build Tracks:**
- Apps: NFT launchpads, DEXs, wallets, dApps
- Protocol layer: cross-chain, privacy + high TPS
- Explorations: AI × identity × RWA experiments

---

## Core Technologies

### 1. NullShot Framework

#### Overview
NullShot is a TypeScript framework for building serverless AI agents with MCP (Model Context Protocol) support, enabling agent interoperability and discovery.

#### Key Features

| Feature | Description |
|---------|-------------|
| **MCP Framework** | Model Context Protocol implementation for agent communication |
| **Agent Framework** | AI SDK integration for building autonomous agents |
| **Multi-Session Auth** | WebSocket and HTTP streaming support |
| **Plugin System** | mcp.json for seamless MCP plugins |
| **Playground UI** | Interactive development environment |

#### Installation

```bash
# Install CLI globally
npm install -g @nullshot/cli

# Create new MCP server
nullshot create mcp

# Create new Agent
nullshot create agent

# Initialize in existing project
nullshot init

# Install dependencies
nullshot install

# Run development mode
nullshot dev
```

#### Supported AI Providers

| Provider | Models | SDK Package |
|----------|--------|-------------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-3.5-turbo | @ai-sdk/openai |
| Anthropic | Claude Opus 4.1, Claude Sonnet 4, Claude 3.7 | @ai-sdk/anthropic |
| DeepSeek | DeepSeek-Chat, DeepSeek-Coder | @ai-sdk/deepseek |
| Workers AI | Llama 3.1/3.2, Gemma 2, Mistral 7B | workers-ai-provider |
| Gemini | Gemini 1.5 Pro, Gemini 1.5 Flash | @ai-sdk/google |
| Grok | Grok-4, Grok-3, Grok-3-mini | @ai-sdk/xai |

#### Documentation Links

| Resource | URL |
|----------|-----|
| **Main Docs** | https://nullshot.ai/docs |
| **Agent Framework** | https://nullshot.ai/en/docs/developers/agents-framework/overview |
| **MCP Framework** | https://nullshot.ai/en/docs/developers/mcp-framework/overview |
| **Platform Overview** | https://nullshot.ai/en/docs/developers/platform/overview |
| **GitHub Repository** | https://github.com/null-shot/typescript-agent-framework |
| **NPM Packages** | @nullshot/cli, @nullshot/mcp-toolbox |

---

### 2. Edenlayer Protocol

#### Overview
An open protocol for AI collaboration and discovery, powering the Agentic Economy. Enables agents to find, collaborate, and transact with each other.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Agent Discovery** | Find agents by capabilities and requirements |
| **Capability Matching** | Match agents based on skills, reputation, pricing |
| **Collaboration Protocol** | Enable multi-agent coordination |
| **Agentic Economy** | Economic layer for agent transactions |

#### Integration Points

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
```

#### Documentation Links

| Resource | URL |
|----------|-----|
| **Main Website** | https://edenlayer.com/ |
| **Eden Platform** | https://edenlayer.com/eden |
| **Contact** | support@edenlayer.com |

---

### 3. Thirdweb

#### Overview
Complete Web3 development platform for building and monetizing blockchain applications with everything in one place.

#### Key Products

| Product | Description | Documentation |
|---------|-------------|---------------|
| **Wallets** | Create wallets to read and transact | [Wallets Docs](https://portal.thirdweb.com/wallets) |
| **x402** | Internet native payments | [x402 Docs](https://portal.thirdweb.com/x402) |
| **Bridge** | Swap and bridge tokens across chains | [Bridge Docs](https://portal.thirdweb.com/bridge) |
| **Tokens** | Launch tokens and markets | [Tokens Docs](https://portal.thirdweb.com/tokens) |
| **AI** | Read and write onchain via natural language | [AI Docs](https://portal.thirdweb.com/ai/chat) |
| **Contracts** | Deploy and interact with smart contracts | [Contracts Docs](https://portal.thirdweb.com/contracts) |
| **Gas Sponsorship** | Account abstraction for gasless transactions | [AA Docs](https://thirdweb.com/account-abstraction) |
| **MCP Server** | Model Context Protocol integration | [MCP Docs](https://portal.thirdweb.com/ai/mcp) |

#### SDKs Available

| Platform | Documentation |
|----------|---------------|
| **TypeScript** | https://portal.thirdweb.com/typescript/v5 |
| **React** | https://portal.thirdweb.com/react/v5 |
| **React Native** | https://portal.thirdweb.com/react-native/v5 |
| **Unity** | https://portal.thirdweb.com/unity/v5 |
| **Unreal Engine** | https://portal.thirdweb.com/unreal-engine |
| **.NET** | https://portal.thirdweb.com/dotnet |

#### Supported Chains

- Ethereum, Base, Arbitrum, Polygon
- Solana, Avalanche, BNB Chain
- ZKSync, World Chain, Treasure
- 95+ chains supported

#### Integration Example

```typescript
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

// Initialize SDK
const sdk = new ThirdwebSDK("ethereum");

// Deploy contract
const contract = await sdk.deployer.deployNFTCollection({
  name: "Agent License",
  primary_sale_recipient: "0x...",
});

// Create smart wallet
const smartWallet = await sdk.wallet.createSmartWallet({
  factoryAddress: "0x...",
  gasless: true,
});
```

#### Documentation Links

| Resource | URL |
|----------|-----|
| **Main Documentation** | https://portal.thirdweb.com/ |
| **HTTP API Reference** | https://portal.thirdweb.com/reference |
| **Playground** | https://playground.thirdweb.com/ |
| **Templates** | https://thirdweb.com/templates |
| **Chainlist** | https://thirdweb.com/chainlist |
| **Dashboard** | https://thirdweb.com/login |
| **GitHub** | https://github.com/thirdweb-dev |

---

### 4. Cortensor Network

#### Overview
Decentralized AI inference platform providing scalable, cost-effective AI processing through distributed computing with blockchain integration.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Decentralized Inference** | Distributed AI processing across nodes |
| **PoI (Proof of Inference)** | Multi-node consensus for inference verification |
| **PoUW (Proof of Useful Work)** | Validator scoring for quality assurance |
| **Evidence Bundles** | Cryptographic proof of inference results |
| **Session Management** | Persistent inference sessions |

#### PoI/PoUW Integration

```typescript
// Cortensor Session Example
interface CortensorSession {
  session_id: string;
  node_ids: string[];
  inference_type: "single" | "consensus";
  poi_required: boolean;
  pouw_validation: boolean;
}

// Evidence Bundle Schema
interface EvidenceBundle {
  bundle_id: string;
  timestamp: string;
  query_hash: string;
  response_hash: string;
  poi_consensus: boolean;
  node_attestations: Array<{
    node_id: string;
    signature: string;
    score: number;
  }>;
  ipfs_cid: string;
}
```

#### Validation Features

| Feature | Use Case |
|---------|----------|
| **Rubric-driven Scoring** | Custom validation rubrics |
| **Embedding Distance Checks** | Semantic similarity validation |
| **Deterministic Policy Tests** | Rule-based validation |
| **Cross-model Checks** | Multi-model consensus |
| **Evidence Bundles** | JSON + IPFS storage |

#### Project Ideas from Hackathon

- Research Ops Agent (reads repos/docs, tracks issues)
- DevOps Agent (monitors routers/validators)
- On-Chain Agent (smart contract interaction)
- Workflow Coordinator (orchestrates tools/APIs)
- AI Oracle (Truth-as-a-Service)
- Memory-as-a-service for agents
- Observability dashboards

#### Documentation Links

| Resource | URL |
|----------|-----|
| **Main Documentation** | https://docs.cortensor.network/ |
| **Hackathon Guide** | https://docs.cortensor.network/community-and-ecosystem/hackathon/hackathon-3 |
| **Community Projects** | https://github.com/cortensor/community-projects |
| **Discord** | https://discord.gg/cortensor |

---

### 5. Phala dStack

#### Overview
Developer-friendly, security-first SDK for deploying Docker-based applications in Trusted Execution Environments (TEE). Enables confidential computing for AI agents.

#### Key Features

| Feature | Description |
|---------|-------------|
| 🔒 **TEE Deployment** | Deploy containerized apps securely in TEE |
| 🛠️ **Docker Support** | Use familiar docker-compose.yaml |
| 🔑 **Secret Management** | Safely manage sensitive data |
| 📡 **TLS Termination** | Built-in service exposure |
| 🔐 **Remote Attestation** | Cryptographic proof of enclave integrity |

#### Architecture Components

| Component | Purpose |
|-----------|---------|
| **dstack-vmm** | Service in TDX host to manage CVMs |
| **dstack-gateway** | Reverse proxy for TLS connections |
| **dstack-kms** | KMS server for key generation |
| **dstack-guest-agent** | Key derivation and attestation in CVM |
| **meta-dstack** | Yocto meta layer for guest images |

#### Deployment Example

```yaml
# docker-compose.yaml for dStack
version: "3"
services:
  agent:
    image: velvet-sentinel/whale-watcher:latest
    volumes:
      - /var/run/dstack.sock:/var/run/dstack.sock
    environment:
      - WALLET_KEY=${ENCRYPTED_WALLET_KEY}
    ports:
      - "8080:80"
    restart: always
```

#### Getting TDX Quote in Container

```bash
# Request attestation quote
curl -X POST --unix-socket /var/run/dstack.sock \
  -H 'Content-Type: application/json' \
  -d '{"reportData": "0x1234deadbeef..."}' \
  http://dstack/GetQuote | jq .
```

#### Secret Management

Encrypted environment variables are:
1. Encrypted client-side
2. Decrypted only within CVM
3. Never exposed to node operators

#### Documentation Links

| Resource | URL |
|----------|-----|
| **Overview** | https://docs.phala.com/dstack/overview |
| **Getting Started** | https://docs.phala.com/dstack/getting-started |
| **Local Development** | https://docs.phala.com/dstack/local-development |
| **Hardware Requirements** | https://docs.phala.com/dstack/hardware-requirements |
| **Security Audit** | https://docs.phala.com/dstack/security-audit |
| **Design Documents** | https://docs.phala.com/dstack/design-documents |
| **GitHub Repository** | https://github.com/Dstack-TEE/dstack |
| **Phala Cloud** | https://docs.phala.com/phala-cloud/getting-started/overview |

---

### 6. Psy Protocol

#### Overview
Next-generation blockchain achieving million-TPS scalability with end-to-end privacy through PARTH architecture, PoW 2.0, zero-knowledge proofs, and programmable identities (SDKeys).

#### Core Architecture

##### PARTH (Parallel Ascending Recursive Tree Hierarchy)

| Feature | Description |
|---------|-------------|
| **Granular State Partitioning** | User-centric partitioning with UCON and CSTATE trees |
| **Localized Writes** | Users write only to their own state trees |
| **Historical Reads** | Read from previous block's immutable checkpoint |
| **No Write Conflicts** | Parallel processing without interference |
| **O(log(n)) Block Times** | Logarithmic scaling with user count |

##### Zero-Knowledge Proofs

| Component | Purpose |
|-----------|---------|
| **Local Transaction Proving (UPS)** | User proves transactions locally |
| **Contract Function Circuits (CFC)** | ZK proof per smart contract call |
| **End Cap Proofs** | Compact proof of user's transaction sequence |
| **GUTA** | Global User Tree Aggregation |
| **Block Proof** | Single proof for entire block |

##### PoW 2.0 (Proof of Useful Work)

| Miner Type | Function |
|------------|----------|
| **Proof Miners** | Generate ZK proofs for GUTA aggregation |
| **DA Miners** | Store blockchain state, prove availability |

#### SDKeys (Programmable Identities)

```rust
/// Agent Identity using Psy Protocol SDKeys
pub struct AgentSDKey {
    pub id: [u8; 32],
    pub permissions: AgentPermissions,
    pub performance_proofs: Vec<PerformanceProof>,
    pub attestations: Vec<Attestation>,
    pub delegations: Vec<Delegation>,
}

pub struct AgentPermissions {
    pub max_trade_size_usd: u64,
    pub allowed_protocols: Vec<ProtocolId>,
    pub allowed_tokens: Vec<TokenId>,
    pub daily_loss_limit_bps: u16,
    pub can_use_leverage: bool,
    pub max_leverage: u8,
}
```

#### Key Differentiators

| Feature | Benefit |
|---------|---------|
| **Millions of TPS** | Horizontal scalability |
| **User Privacy** | Transactions proven locally |
| **SDKeys** | Programmable public keys |
| **Fixed Low Fees** | No fee auctions |
| **Proof of Math** | Cryptographic guarantees |
| **AI Agent Ready** | Keyless autonomous agents |

#### Documentation Links

| Resource | URL |
|----------|-----|
| **Main Docs** | https://psy.xyz/docs |
| **Developer Portal** | https://psy.xyz/docs |
| **Introduction** | https://psy.xyz/docs/network/introduction |
| **Miners & Roles** | https://psy.xyz/docs/network/roles |
| **How a Block is Made** | https://psy.xyz/docs/network/how-a-block-is-made |
| **GUTA** | https://psy.xyz/docs/network/guta |
| **Local Proving** | https://psy.xyz/docs/network/local-proving |
| **Smart Contracts** | https://psy.xyz/docs/network/contracts |
| **Jargon** | https://psy.xyz/docs/network/jargon |
| **GitHub** | https://github.com/PsyProtocol |
| **Rust Tutorial (CN)** | https://www.runoob.com/rust/rust-tutorial.html |

---

### 7. x402 Payment Protocol

#### Overview
HTTP 402 Payment Required implementation for internet-native micropayments, enabling pay-per-inference and pay-per-call economics for AI agents.

#### Key Features

| Feature | Description |
|---------|-------------|
| **HTTP 402 Flow** | Standard payment required response |
| **Micropayments** | Sub-cent transaction support |
| **Multi-chain** | Support for multiple settlement chains |
| **Agent-to-Agent** | Direct payments between AI agents |
| **Escrow Support** | Optional escrow for disputed transactions |

#### Payment Flow

```
1. Request Service
   └─> Agent A calls Agent B's tool

2. HTTP 402 Response
   └─> Agent B returns payment requirements

3. Payment Execution
   └─> Agent A sends payment (Psy Protocol for instant settlement)

4. Service Delivery
   └─> Agent B executes inference + returns result

5. Evidence Bundle
   └─> Result includes IPFS CID for verification
```

#### Implementation

```typescript
interface X402PaymentRequest {
  payment_id: string;
  amount: string;
  currency: "ETH" | "USDC" | "COR" | "PSY";
  recipient_address: string;
  recipient_agent_id: string;
  service: {
    tool_name: string;
    parameters_hash: string;
    expected_response_type: string;
  };
  expires_at: number;
  settlement_chains: ("psy" | "ethereum" | "arbitrum")[];
  escrow?: {
    enabled: boolean;
    release_conditions: string[];
    dispute_resolver: string;
  };
}
```

#### Pricing Models

| Model | Use Case | Example |
|-------|----------|---------|
| **Pay-per-call** | One-time queries | 0.001-0.01 ETH |
| **Subscription** | Time-based access | 0.1 ETH/day |
| **Pay-per-event** | Alert streams | 0.0001 ETH/alert |
| **Success fee** | Trade execution | 0.1% of profit |

#### Documentation Links

| Resource | URL |
|----------|-----|
| **Thirdweb x402 Docs** | https://portal.thirdweb.com/x402 |
| **x402 Product Page** | https://thirdweb.com/x402 |
| **Native Payments** | https://thirdweb.com/monetize/bridge |

---

## Development Stack

### Languages & Frameworks

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Core Logic** | Rust | SDKey management, ZK proofs (Psy requirement) |
| **Agent Logic** | TypeScript | NullShot agents, MCP implementation |
| **Smart Contracts** | Solidity | Thirdweb contract deployment |
| **Frontend** | Next.js / React | Dashboard, web app |

### Package Dependencies

```json
{
  "dependencies": {
    // NullShot
    "@nullshot/cli": "latest",
    "@nullshot/mcp-toolbox": "latest",
    
    // Thirdweb
    "@thirdweb-dev/sdk": "^5.0.0",
    "@thirdweb-dev/react": "^5.0.0",
    
    // AI SDKs
    "@ai-sdk/openai": "latest",
    "@ai-sdk/anthropic": "latest",
    
    // Phala
    "@phala/dstack-sdk": "latest",
    
    // Storage
    "ipfs-http-client": "latest",
    
    // Utilities
    "ethers": "^6.0.0",
    "viem": "^2.0.0"
  }
}
```

### Rust Dependencies (Cargo.toml)

```toml
[dependencies]
# Psy Protocol
psy-sdk = "0.1"

# ZK Proofs
plonky2 = "0.2"
ark-ff = "0.4"
ark-ec = "0.4"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Async Runtime
tokio = { version = "1.0", features = ["full"] }

# Cryptography
sha2 = "0.10"
ed25519-dalek = "2.0"
```

---

## Documentation Links

### Quick Reference

| Technology | Main Docs | GitHub | Discord |
|------------|-----------|--------|---------|
| **NullShot** | [Docs](https://nullshot.ai/docs) | [GitHub](https://github.com/null-shot/typescript-agent-framework) | [Discord](https://discord.gg/nullshot) |
| **Edenlayer** | [Website](https://edenlayer.com/) | - | - |
| **Thirdweb** | [Portal](https://portal.thirdweb.com/) | [GitHub](https://github.com/thirdweb-dev) | [Discord](https://discord.gg/thirdweb) |
| **Cortensor** | [Docs](https://docs.cortensor.network/) | [GitHub](https://github.com/cortensor) | [Discord](https://discord.gg/cortensor) |
| **Phala dStack** | [Docs](https://docs.phala.com/dstack/overview) | [GitHub](https://github.com/Dstack-TEE/dstack) | [Discord](https://discord.gg/phala-network) |
| **Psy Protocol** | [Docs](https://psy.xyz/docs) | [GitHub](https://github.com/PsyProtocol) | - |

### Hackathon Pages

| Hackathon | DoraHacks Page |
|-----------|----------------|
| **NullShot Hacks** | https://dorahacks.io/hackathon/nullshothacks/detail |
| **Cortensor #3** | https://dorahacks.io/hackathon/1768/detail |
| **Psy Ascend** | https://dorahacks.io/hackathon/1511/detail |

---

## Integration Matrix

### Feature Mapping by Technology

| Feature | NullShot | Cortensor | Phala | Psy | Thirdweb |
|---------|----------|-----------|-------|-----|----------|
| Agent Framework | ✅ | - | - | - | - |
| MCP Protocol | ✅ | ✅ (stretch) | - | - | ✅ |
| Decentralized Inference | - | ✅ | - | - | - |
| PoI/PoUW Validation | - | ✅ | - | - | - |
| TEE Execution | - | - | ✅ | - | - |
| Secret Management | - | - | ✅ | - | - |
| ZK Proofs | - | - | - | ✅ | - |
| SDKeys | - | - | - | ✅ | - |
| High-TPS | - | - | - | ✅ | - |
| Smart Contracts | - | - | - | - | ✅ |
| Wallets | - | - | - | - | ✅ |
| x402 Payments | - | ✅ (stretch) | - | - | ✅ |
| NFTs | - | - | - | - | ✅ |
| Account Abstraction | - | - | - | - | ✅ |

### Data Flow Integration

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   USER/DAO      │────▶│   THIRDWEB      │────▶│   NULLSHOT      │
│   (Wallet)      │     │   (AA, NFTs)    │     │   (MCP Agents)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                              ┌──────────────────────────┤
                              ▼                         ▼
                    ┌─────────────────┐       ┌─────────────────┐
                    │   EDENLAYER     │       │   CORTENSOR     │
                    │   (Discovery)   │       │   (Inference)   │
                    └─────────────────┘       └─────────────────┘
                                                        │
                              ┌──────────────────────────┤
                              ▼                         ▼
                    ┌─────────────────┐       ┌─────────────────┐
                    │   PHALA dSTACK  │       │   x402          │
                    │   (TEE Compute) │       │   (Payments)    │
                    └─────────────────┘       └─────────────────┘
                              │                         │
                              └──────────────┬──────────┘
                                             ▼
                                   ┌─────────────────┐
                                   │   PSY PROTOCOL  │
                                   │   (Settlement)  │
                                   └─────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | December 2025 | Initial tech stack documentation |

---

*This documentation is part of the Velvet Sentinel project, targeting NullShot Hacks, Cortensor Hackathon #3, and Psy Ascend Hack 2025.*

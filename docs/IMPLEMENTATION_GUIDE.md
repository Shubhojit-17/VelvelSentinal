# Velvet Sentinel - Implementation Guide

> **Concise implementation roadmap with version requirements and compatibility notes**

---

## 📋 Version Matrix & Compatibility

### Core Dependencies (December 2024)

| Technology | Version | Node.js | Rust | Notes |
|------------|---------|---------|------|-------|
| **@nullshot/cli** | 0.2.5 | 18+ | - | Cloudflare Workers based |
| **thirdweb** | 5.115.0 | 18+ | - | Use new SDK, NOT legacy `@thirdweb-dev/sdk` |
| **x402** | 0.7.3 | 18+ | - | Coinbase protocol |
| **@phala/dstack-sdk** | 0.5.7 | 18+ | - | ⚠️ Breaking changes from 0.3.x |
| **viem** | 2.41.2 | 18+ | - | Ethereum interactions |
| **Rust** | 1.91.1 | - | ✓ | Edition 2021 |

### ⚠️ Critical Compatibility Notes

1. **Thirdweb SDK Migration**: The legacy `@thirdweb-dev/sdk` (4.0.99) is deprecated. Use `thirdweb` (5.x) instead
2. **Phala dStack Migration**: `TappdClient` → `DstackClient`, socket path changed to `/var/run/dstack.sock`
3. **Phala Security**: Use `toViemAccountSecure()` NOT `toViemAccount()` (security vulnerability)
4. **x402**: Requires thirdweb integration - NOT standalone

---

## 🚀 Implementation Process

### Phase 1: Environment Setup (Days 1-3)

```bash
# 1. Initialize monorepo
mkdir velvet-sentinel && cd velvet-sentinel
npm init -y
npm install -D turbo typescript @types/node

# 2. Install core TypeScript dependencies
npm install thirdweb x402 x402-fetch x402-express viem @phala/dstack-sdk

# 3. Install NullShot CLI globally
npm install -g @nullshot/cli@0.2.5

# 4. Rust setup (for Psy Protocol components)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
```

**`package.json` (root):**
```json
{
  "name": "velvet-sentinel",
  "private": true,
  "workspaces": ["agents/*", "packages/*", "contracts", "dashboard"],
  "engines": {
    "node": ">=18.0.0"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

### Phase 2: Phala dStack Integration (Days 4-7)

**Prerequisites:**
- Intel TDX-compatible server OR Phala Cloud account
- Ubuntu 24.04 (recommended)
- 16GB+ RAM, 100GB+ disk

**1. Agent TEE Wrapper (`packages/phala-enclave/src/worker.ts`):**
```typescript
import { DstackClient } from '@phala/dstack-sdk';
import { toViemAccountSecure } from '@phala/dstack-sdk/viem';
import { createWalletClient, http } from 'viem';

export class TEEWorker {
  private client: DstackClient;

  constructor() {
    // Production: auto-connects to /var/run/dstack.sock
    // Dev: use DSTACK_SIMULATOR_ENDPOINT env var
    this.client = new DstackClient();
  }

  async getSecureWallet(chain: any) {
    const keyResult = await this.client.getKey('wallet/main', 'ethereum');
    // ⚠️ MUST use Secure version - legacy has vulnerabilities
    const account = toViemAccountSecure(keyResult);
    
    return createWalletClient({
      account,
      chain,
      transport: http()
    });
  }

  async getAttestation(data: string) {
    // Data must be ≤ 64 bytes - hash if larger
    const quote = await this.client.getQuote(data);
    return {
      quote: quote.quote,
      rtmrs: quote.replayRtmrs()
    };
  }
}
```

**2. Docker Compose for Agent:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  whale-watcher:
    build: ./agents/whale-watcher
    volumes:
      - /var/run/dstack.sock:/var/run/dstack.sock  # dStack 0.5.x
    environment:
      - NODE_ENV=production
```

---

### Phase 3: NullShot MCP Agent (Days 8-12)

**1. Create Agent with CLI:**
```bash
nullshot create agent
# Follow prompts for "whale-watcher"
```

**2. MCP Manifest (`agents/whale-watcher/mcp-manifest.json`):**
```json
{
  "agent_id": "velvet-sentinel://whale-watcher-001",
  "name": "Whale Watcher",
  "version": "1.0.0",
  "tools": [
    {
      "name": "get_whale_movements",
      "description": "Returns significant wallet movements",
      "parameters": {
        "type": "object",
        "properties": {
          "token": { "type": "string" },
          "threshold_usd": { "type": "number" }
        },
        "required": ["token"]
      },
      "pricing": {
        "protocol": "x402",
        "amount": "0.001",
        "currency": "ETH"
      }
    }
  ]
}
```

**3. Agent Implementation:**
```typescript
// agents/whale-watcher/src/index.ts
import { TEEWorker } from '@velvet/phala-enclave';

export class WhaleWatcher {
  private tee: TEEWorker;

  async initialize() {
    this.tee = new TEEWorker();
  }

  async getWhaleMovements(token: string, threshold: number) {
    // Implementation with TEE-protected keys
    const wallet = await this.tee.getSecureWallet(arbitrum);
    // ... monitoring logic
  }
}
```

---

### Phase 4: x402 Payment Integration (Days 13-16)

**1. Server-Side (Express middleware):**
```typescript
// packages/x402-payments/src/server.ts
import { createThirdwebClient } from 'thirdweb';
import { facilitator, settlePayment } from 'thirdweb/x402';
import { arbitrumSepolia } from 'thirdweb/chains';

const client = createThirdwebClient({ 
  secretKey: process.env.THIRDWEB_SECRET_KEY! 
});

const x402Facilitator = facilitator({
  client,
  serverWalletAddress: process.env.SERVER_WALLET!,
});

export async function handlePayment(req: Request) {
  const paymentData = req.headers.get('x-payment');
  
  const result = await settlePayment({
    resourceUrl: req.url,
    method: req.method,
    paymentData,
    payTo: process.env.SERVER_WALLET!,
    network: arbitrumSepolia,
    price: '$0.001',
    facilitator: x402Facilitator,
  });
  
  return result;
}
```

**2. Client-Side (React):**
```typescript
// dashboard/src/hooks/useAgentPayment.ts
import { useFetchWithPayment } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';

const client = createThirdwebClient({ 
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID! 
});

export function useAgentCall() {
  const { fetchWithPayment, isPending } = useFetchWithPayment(client);
  
  const callAgent = async (agentUrl: string, params: any) => {
    return await fetchWithPayment(agentUrl, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  };
  
  return { callAgent, isPending };
}
```

---

### Phase 5: Cortensor Integration (Days 17-21)

**Note:** Cortensor API documentation is limited. Integration based on hackathon specs.

```typescript
// packages/cortensor-client/src/inference.ts
export interface CortensorConfig {
  endpoint: string;
  apiKey: string;
}

export class CortensorClient {
  constructor(private config: CortensorConfig) {}

  async inference(prompt: string, options: {
    model?: string;
    requirePoI?: boolean;  // Proof of Inference
    nodeCount?: number;    // For consensus
  }) {
    const response = await fetch(`${this.config.endpoint}/inference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        poi_required: options.requirePoI ?? true,
        consensus_nodes: options.nodeCount ?? 3
      })
    });
    
    return response.json();
  }

  async validateResponse(responseId: string) {
    // PoI validation endpoint
    return fetch(`${this.config.endpoint}/validate/${responseId}`);
  }
}
```

---

### Phase 6: Psy Protocol (Rust) (Days 22-28)

**1. Cargo Workspace (`crates/Cargo.toml`):**
```toml
[workspace]
members = ["sdkey-manager", "zk-proofs", "psy-integration"]
resolver = "2"

[workspace.package]
edition = "2021"
rust-version = "1.75"
license = "MIT"

[workspace.dependencies]
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

**2. SDKey Manager (`crates/sdkey-manager/src/lib.rs`):**
```rust
use serde::{Deserialize, Serialize};

/// Agent identity using Psy Protocol SDKeys
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSDKey {
    pub id: [u8; 32],
    pub permissions: AgentPermissions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPermissions {
    pub max_trade_size_usd: u64,
    pub allowed_protocols: Vec<String>,
    pub daily_loss_limit_bps: u16,  // basis points
}

impl AgentSDKey {
    pub fn new(seed: &[u8; 32]) -> Self {
        // SDKey derivation logic per Psy spec
        Self {
            id: *seed,  // Simplified - actual impl uses Psy derivation
            permissions: AgentPermissions::default(),
        }
    }
    
    pub fn can_execute_trade(&self, size_usd: u64, protocol: &str) -> bool {
        size_usd <= self.permissions.max_trade_size_usd
            && self.permissions.allowed_protocols.contains(&protocol.to_string())
    }
}

impl Default for AgentPermissions {
    fn default() -> Self {
        Self {
            max_trade_size_usd: 10_000,
            allowed_protocols: vec!["uniswap".into(), "aave".into()],
            daily_loss_limit_bps: 500,  // 5%
        }
    }
}
```

---

### Phase 7: Smart Contracts (Days 29-32)

**1. Hardhat Setup:**
```bash
cd contracts
npm init -y
npm install hardhat @thirdweb-dev/contracts viem
npx hardhat init
```

**2. Agent Registry Contract:**
```solidity
// contracts/src/AgentRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";

contract AgentRegistry is PermissionsEnumerable {
    struct Agent {
        address owner;
        bytes32 attestationHash;  // Phala TEE attestation
        uint256 reputation;
        bool active;
    }
    
    mapping(bytes32 => Agent) public agents;
    
    event AgentRegistered(bytes32 indexed agentId, address owner);
    
    function registerAgent(
        bytes32 agentId,
        bytes32 attestationHash
    ) external {
        require(agents[agentId].owner == address(0), "Already registered");
        
        agents[agentId] = Agent({
            owner: msg.sender,
            attestationHash: attestationHash,
            reputation: 100,
            active: true
        });
        
        emit AgentRegistered(agentId, msg.sender);
    }
}
```

---

### Phase 8: Dashboard & Demo (Days 33-38)

**1. Next.js Setup:**
```bash
cd dashboard
npx create-next-app@latest . --typescript --tailwind --app
npm install thirdweb recharts
```

**2. Thirdweb Provider:**
```typescript
// dashboard/src/app/providers.tsx
'use client';

import { ThirdwebProvider } from 'thirdweb/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}
```

---

## 🔧 Development Workflow

### Local Development

```bash
# Terminal 1: Phala Simulator
git clone https://github.com/Dstack-TEE/dstack.git
cd dstack/sdk/simulator
./build.sh && ./dstack-simulator

# Terminal 2: NullShot Dev
cd velvet-sentinel
nullshot dev

# Terminal 3: Dashboard
cd dashboard
npm run dev
```

### Environment Variables

```env
# .env.local
THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key
DSTACK_SIMULATOR_ENDPOINT=http://localhost:8090
CORTENSOR_API_KEY=your_cortensor_key
CORTENSOR_ENDPOINT=https://api.cortensor.network
```

---

## ⚠️ Known Issues & Workarounds

| Issue | Workaround |
|-------|------------|
| Cortensor API docs limited | Use hackathon Discord for support |
| Psy Protocol SDK not public | Implement based on whitepaper specs |
| x402 testnet only | Use Arbitrum Sepolia for testing |
| dStack needs TDX hardware | Use simulator for development |

---

## 📊 Testing Strategy

| Component | Test Method |
|-----------|-------------|
| TEE Integration | dStack simulator + unit tests |
| x402 Payments | Testnet with mock facilitator |
| MCP Communication | NullShot local dev mode |
| Smart Contracts | Hardhat local network |
| ZK Proofs | Rust unit tests |

---

## 📁 Final Repository Structure

```
velvet-sentinel/
├── package.json              # Workspaces config
├── turbo.json               # Build orchestration
├── .env.example
│
├── crates/                   # Rust (Psy Protocol)
│   ├── Cargo.toml
│   ├── sdkey-manager/
│   ├── zk-proofs/
│   └── psy-integration/
│
├── agents/                   # TypeScript (NullShot)
│   ├── whale-watcher/
│   ├── sentiment-analyst/
│   ├── risk-guardian/
│   └── coordinator/
│
├── packages/                 # Shared packages
│   ├── cortensor-client/
│   ├── x402-payments/
│   ├── phala-enclave/
│   └── shared-types/
│
├── contracts/               # Solidity (Thirdweb)
│   ├── src/
│   └── hardhat.config.ts
│
├── dashboard/               # Next.js
│   ├── app/
│   └── package.json
│
└── docker/
    └── docker-compose.yml
```

---

## 📅 6-Week Implementation Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Setup | Monorepo, deps, dev environment |
| 2 | TEE | Phala dStack agent wrapper |
| 3 | Agents | NullShot MCP agents (2-3) |
| 4 | Payments | x402 integration, Cortensor |
| 5 | Rust | SDKey, ZK proofs skeleton |
| 6 | Polish | Dashboard, demos, documentation |

---

## 🔗 Quick Reference Links

- **NullShot CLI**: https://github.com/null-shot/typescript-agent-framework
- **Thirdweb x402**: https://portal.thirdweb.com/x402
- **Phala dStack**: https://docs.phala.com/dstack/getting-started
- **x402 Protocol**: https://x402.org / https://github.com/coinbase/x402
- **Viem Docs**: https://viem.sh/docs

---

*Last Updated: December 2024*

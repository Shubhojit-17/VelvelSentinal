# Velvet Sentinel - API Reference

> Complete API documentation for all services and integrations

---

## Table of Contents

1. [Agent API](#agent-api)
2. [Infrastructure APIs](#infrastructure-apis)
3. [Smart Contract APIs](#smart-contract-apis)
4. [External Service APIs](#external-service-apis)

---

## Agent API

### Agent Core Interface

All agents implement the `IAgent` interface from `@velvet/agent-core`.

```typescript
interface IAgent {
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  
  // Task Execution
  execute(task: AgentTask): Promise<AgentResult>;
  
  // Identity
  getIdentity(): AgentIdentity;
  getAttestation(): Promise<TEEAttestation>;
  
  // Health
  healthCheck(): Promise<HealthStatus>;
}
```

### Arbitrage Agent

**Endpoint**: `/api/arbitrage`

#### GET /opportunities
Fetch current arbitrage opportunities.

```typescript
// Request
GET /api/arbitrage/opportunities?minProfit=0.5&chains=ethereum,arbitrum

// Response
{
  "success": true,
  "data": [
    {
      "id": "opp_123",
      "tokenA": "WETH",
      "tokenB": "USDC",
      "buyDex": "Uniswap V3",
      "sellDex": "Sushiswap",
      "buyPrice": 2450.50,
      "sellPrice": 2455.75,
      "profitPercent": 0.21,
      "estimatedGas": "0.002 ETH",
      "confidence": 0.85
    }
  ]
}
```

#### POST /execute
Execute an arbitrage trade.

```typescript
// Request
POST /api/arbitrage/execute
{
  "opportunityId": "opp_123",
  "amount": "1.0",
  "slippage": 0.5,
  "deadline": 300
}

// Response
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "status": "pending",
    "estimatedProfit": "5.25 USDC"
  }
}
```

### Governance Agent

**Endpoint**: `/api/governance`

#### GET /proposals
Fetch active governance proposals.

```typescript
// Request
GET /api/governance/proposals?protocol=aave&status=active

// Response
{
  "success": true,
  "data": [
    {
      "id": "AIP-123",
      "protocol": "Aave",
      "title": "Risk Parameter Update",
      "summary": "...",
      "votingEnds": "2025-01-20T00:00:00Z",
      "forVotes": "1500000",
      "againstVotes": "250000",
      "recommendation": {
        "vote": "FOR",
        "confidence": 0.78,
        "reasoning": "..."
      }
    }
  ]
}
```

#### POST /vote
Submit a vote on a proposal.

```typescript
// Request
POST /api/governance/vote
{
  "proposalId": "AIP-123",
  "vote": "FOR",
  "votingPower": "1000"
}

// Response
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "votingPower": "1000",
    "status": "confirmed"
  }
}
```

### Sentinel Agent

**Endpoint**: `/api/sentinel`

#### GET /threats
Get current threat assessments.

```typescript
// Request
GET /api/sentinel/threats?severity=high

// Response
{
  "success": true,
  "data": [
    {
      "id": "threat_456",
      "type": "rug_pull_risk",
      "target": "0x...",
      "severity": "high",
      "confidence": 0.92,
      "indicators": [
        "Liquidity removal detected",
        "Large wallet accumulation",
        "Contract upgrade without timelock"
      ],
      "recommendedAction": "EXIT_POSITION",
      "detectedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /alert
Create a manual security alert.

```typescript
// Request
POST /api/sentinel/alert
{
  "type": "suspicious_activity",
  "target": "0x...",
  "description": "Unusual token transfers detected",
  "evidence": ["tx_hash_1", "tx_hash_2"]
}

// Response
{
  "success": true,
  "data": {
    "alertId": "alert_789",
    "status": "investigating"
  }
}
```

---

## Infrastructure APIs

### Cache Interface

```typescript
import { createCacheProvider, CacheProvider } from '@velvet/shared-types';

// Create provider
const cache: CacheProvider = createCacheProvider({
  provider: 'redis',  // or 'memory'
  redis: { url: 'redis://localhost:6379' }
});

await cache.connect();

// Basic operations
await cache.set('key', { data: 'value' }, 3600);  // TTL in seconds
const data = await cache.get('key');
await cache.delete('key');
await cache.has('key');

// Pattern operations
const keys = await cache.keys('prefix:*');
await cache.clear();  // Clear all

await cache.disconnect();
```

### Database Interface

```typescript
import { createDatabaseProvider, DatabaseProvider } from '@velvet/shared-types';

// Create provider
const db: DatabaseProvider = createDatabaseProvider({
  provider: 'postgresql',  // or 'sqlite', 'memory'
  postgresql: { url: 'postgresql://...' }
});

await db.connect();

// CRUD operations
const id = await db.create('agents', { name: 'Sentinel', type: 'security' });
const agent = await db.read('agents', id);
await db.update('agents', id, { status: 'active' });
await db.delete('agents', id);

// Query operations
const agents = await db.search('agents', { type: 'security' });

await db.disconnect();
```

### WebSocket Interface

**Server-side**:
```typescript
import { WebSocketManager } from '@velvet/shared-types';

const wsManager = new WebSocketManager({ port: 8080 });
await wsManager.start();

// Subscribe to messages
wsManager.subscribe('price_update', (data, clientId) => {
  console.log(`Price update from ${clientId}:`, data);
});

// Broadcast to all clients
wsManager.broadcast('new_opportunity', { pair: 'ETH/USDC', profit: 0.5 });

// Room-based messaging
wsManager.joinRoom(clientId, 'arbitrage_alerts');
wsManager.broadcastToRoom('arbitrage_alerts', 'alert', { ... });
```

**Client-side**:
```typescript
import { WebSocketClient } from '@velvet/shared-types';

const client = new WebSocketClient('ws://localhost:8080');

client.on('connect', () => console.log('Connected'));
client.on('price_update', (data) => console.log('Price:', data));

await client.connect();
client.send('subscribe', { channel: 'eth_prices' });
```

### Psy Protocol Interface

```typescript
import { createPsyConnector, IPsyConnector } from '@velvet/shared-types';

const psy: IPsyConnector = createPsyConnector({
  networkUrl: 'https://mainnet.psy.network',
  contractAddress: '0x...'
});

await psy.connect();

// Agent registration
const agentId = await psy.registerAgent({
  agentId: 'my-agent',
  owner: '0x...',
  teeAttestation: 'base64...',
  capabilities: ['arbitrage', 'monitoring'],
  stakingAmount: BigInt(1000),
  metadata: {
    name: 'My Agent',
    description: 'Arbitrage detection',
    version: '1.0.0'
  }
});

// Reputation
const reputation = await psy.getReputation(agentId);
await psy.submitReputationUpdate({
  agentId,
  taskId: 'task_123',
  outcome: 'success',
  score: 95,
  evidence: 'QmIPFSHash...',
  timestamp: Date.now()
});

// Staking
await psy.stake(agentId, BigInt(500));
const stakingInfo = await psy.getStakingInfo(agentId);

// Task coordination
const taskId = await psy.submitTask({
  taskType: 'arbitrage',
  requiredCapabilities: ['dex_trading'],
  reward: BigInt(100),
  deadline: Date.now() + 3600000,
  assignedAgents: []
});

// Events
psy.onReputationChange((update) => {
  console.log('Reputation changed:', update);
});
```

---

## Smart Contract APIs

### AgentRegistry Contract

**Address**: TBD (needs deployment)

#### Functions

```solidity
// Register an agent
function registerAgent(
    bytes32 agentId,
    bytes calldata attestation,
    bytes calldata capabilities
) external returns (bool);

// Get agent info
function getAgent(bytes32 agentId) external view returns (
    address owner,
    bytes memory attestation,
    uint256 reputation,
    bool active
);

// Update reputation (only coordinator)
function updateReputation(
    bytes32 agentId,
    uint256 newScore,
    bytes calldata evidence
) external;

// Slash agent stake
function slash(
    bytes32 agentId,
    uint256 amount,
    bytes32 reason
) external;
```

#### Events

```solidity
event AgentRegistered(bytes32 indexed agentId, address indexed owner);
event ReputationUpdated(bytes32 indexed agentId, uint256 oldScore, uint256 newScore);
event AgentSlashed(bytes32 indexed agentId, uint256 amount, bytes32 reason);
```

### SyndicateVault Contract

**Address**: TBD (needs deployment)

#### Functions

```solidity
// Create a new syndicate
function createSyndicate(
    string calldata name,
    uint256 votingThreshold,
    address[] calldata initialMembers
) external returns (bytes32 syndicateId);

// Deposit funds
function deposit(bytes32 syndicateId) external payable;

// Propose action
function proposeAction(
    bytes32 syndicateId,
    address target,
    bytes calldata data,
    uint256 value
) external returns (uint256 proposalId);

// Vote on proposal
function vote(
    bytes32 syndicateId,
    uint256 proposalId,
    bool support
) external;

// Execute approved proposal
function execute(
    bytes32 syndicateId,
    uint256 proposalId
) external;
```

---

## External Service APIs

### DexScreener API

**Base URL**: `https://api.dexscreener.com`

```typescript
// Get token pairs
GET /latest/dex/tokens/{tokenAddress}

// Response
{
  "pairs": [
    {
      "chainId": "ethereum",
      "dexId": "uniswap",
      "pairAddress": "0x...",
      "baseToken": { "address": "0x...", "symbol": "WETH" },
      "quoteToken": { "address": "0x...", "symbol": "USDC" },
      "priceNative": "2450.50",
      "priceUsd": "2450.50",
      "liquidity": { "usd": 15000000 },
      "volume": { "h24": 5000000 }
    }
  ]
}
```

### Phala TEE API

```typescript
// Generate attestation
POST /attestation/generate
{
  "agentId": "agent_123",
  "publicKey": "0x...",
  "timestamp": 1705312800
}

// Verify attestation
POST /attestation/verify
{
  "attestation": "base64...",
  "expectedMeasurement": "0x..."
}

// Response
{
  "valid": true,
  "quote": {
    "mrEnclave": "0x...",
    "mrSigner": "0x...",
    "timestamp": 1705312800
  }
}
```

### Cortensor Inference API

```typescript
// Submit inference request
POST /inference
{
  "modelId": "default",
  "prompt": "Analyze the following governance proposal...",
  "maxTokens": 1000,
  "temperature": 0.7
}

// Response
{
  "requestId": "req_123",
  "status": "completed",
  "result": {
    "text": "Based on my analysis...",
    "tokens": 450,
    "nodeId": "node_abc"
  },
  "attestation": "base64..."  // Node's TEE attestation
}
```

---

## Error Handling

All APIs return errors in a consistent format:

```typescript
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Not enough funds to execute trade",
    "details": {
      "required": "1.5 ETH",
      "available": "0.8 ETH"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication |
| `INVALID_INPUT` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Too many requests |
| `INSUFFICIENT_BALANCE` | Not enough funds |
| `TEE_VERIFICATION_FAILED` | Attestation verification failed |
| `NETWORK_ERROR` | External service unavailable |
| `CONTRACT_ERROR` | Smart contract call failed |

---

## Rate Limits

| Service | Limit | Window |
|---------|-------|--------|
| DexScreener | 300 requests | 5 minutes |
| Agent APIs | 100 requests | 1 minute |
| WebSocket | 50 messages | 1 second |
| Contract Calls | 20 transactions | 1 minute |

---

## SDKs & Client Libraries

### TypeScript/JavaScript

```bash
# Install from workspace
pnpm add @velvet/shared-types @velvet/agent-core

# Usage
import { createPsyConnector, createCacheProvider } from '@velvet/shared-types';
```

### Rust

```toml
# Cargo.toml
[dependencies]
psy-integration = { path = "../crates/psy-integration" }
zk-proofs = { path = "../crates/zk-proofs" }
```

---

*For detailed implementation examples, see the agent source code in `/agents/` directory.*

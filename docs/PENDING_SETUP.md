# Velvet Sentinel - Pending Setup & Configuration Guide

> **Status**: MVP Complete with Infrastructure Gaps  
> **Last Updated**: January 2025  
> **Overall Completion**: ~80%

This document outlines all pending tasks, API services that need configuration, and setup steps required to make Velvet Sentinel production-ready.

---

## Table of Contents

1. [Quick Start (Development)](#quick-start-development)
2. [API Services Configuration](#api-services-configuration)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Pending Development Tasks](#pending-development-tasks)
5. [Contract Deployment](#contract-deployment)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Production Deployment Checklist](#production-deployment-checklist)

---

## Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/Shubhojit-17/VelvelSentinal.git
cd VelvelSentinal

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the dashboard
cd dashboard && pnpm dev
```

---

## API Services Configuration

### 1. Thirdweb (Wallet & Payments)
**Status**: ✅ Configured  
**Required For**: Wallet connection, x402 payments, smart wallet

```env
# dashboard/.env.local
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key
```

**Setup Steps**:
1. Go to [thirdweb.com](https://thirdweb.com)
2. Create a project
3. Copy Client ID to `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
4. Copy Secret Key to `THIRDWEB_SECRET_KEY`

---

### 2. Phala dStack (TEE Attestation)
**Status**: ⚠️ Partial - Mock available, production needs configuration  
**Required For**: Trusted Execution Environment, attestation verification

```env
# Agent environment
PHALA_ENDPOINT=https://api.phala.network/tee
PHALA_WORKER_ADDRESS=your_worker_address
PHALA_CLUSTER_ID=your_cluster_id
```

**Setup Steps**:
1. Visit [Phala Network Dashboard](https://dashboard.phala.network)
2. Deploy a TEE worker or connect to existing cluster
3. Get worker address and cluster ID
4. Configure endpoint in agent manifests

**Pending Tasks**:
- [ ] Deploy actual TEE worker to Phala Network
- [ ] Implement on-chain TDX quote verification
- [ ] Connect attestation flow to Intel TDX

---

### 3. Cortensor (Decentralized AI)
**Status**: ⚠️ Interface defined, needs actual network connection  
**Required For**: Decentralized AI inference, model routing

```env
# Agent environment
CORTENSOR_NODE_URL=https://node.cortensor.network
CORTENSOR_API_KEY=your_api_key
CORTENSOR_MODEL_ID=default_model
```

**Setup Steps**:
1. Join Cortensor network (currently in development)
2. Register as a node operator or user
3. Get API credentials
4. Configure model preferences

**Pending Tasks**:
- [ ] Replace mock inference with actual Cortensor API calls
- [ ] Implement model selection based on task type
- [ ] Add inference result caching

---

### 4. Psy Network (Agent Coordination)
**Status**: ⚠️ Mock connector created, production needs SDK  
**Required For**: Agent registration, reputation, staking, task coordination

```env
# Agent environment
PSY_NETWORK_URL=https://mainnet.psy.network
PSY_CONTRACT_ADDRESS=0x...
PSY_PRIVATE_KEY=your_private_key
```

**Setup Steps**:
1. Await Psy Network mainnet launch
2. Deploy agent registry contract
3. Configure network endpoints
4. Set up staking wallet

**Pending Tasks**:
- [ ] Implement `PsyConnector` class (currently stub)
- [ ] Integrate Psy SDK when available
- [ ] Set up real-time event subscriptions
- [ ] Implement slashing and reward distribution

---

### 5. DexScreener API (Price Feeds)
**Status**: ✅ Implemented  
**Required For**: DEX price data, arbitrage detection

```env
# No API key required for basic usage
# Rate limiting may require premium access
DEXSCREENER_RATE_LIMIT=300  # requests per 5 minutes
```

**Current Implementation**:
- Real-time price fetching from DexScreener
- Multi-chain support (Ethereum, BSC, Polygon, Arbitrum)
- Token pair detection and price comparison

---

### 6. Redis (Caching)
**Status**: 🆕 Interface created, needs deployment  
**Required For**: Scalability, session management, rate limiting

```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password
REDIS_TLS=false
```

**Setup Options**:

**Option A: Local Redis**
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Or install locally
# Windows: Use WSL or Redis for Windows
# macOS: brew install redis
# Linux: apt install redis-server
```

**Option B: Managed Redis (Production)**
- [Upstash](https://upstash.com) - Serverless, free tier available
- [Redis Cloud](https://redis.com/cloud)
- [AWS ElastiCache](https://aws.amazon.com/elasticache)

---

### 7. PostgreSQL (Database)
**Status**: 🆕 Interface created, needs deployment  
**Required For**: Persistent storage, analytics, audit logs

```env
DATABASE_URL=postgresql://user:password@localhost:5432/velvet_sentinel
DATABASE_SSL=false
```

**Setup Options**:

**Option A: Local PostgreSQL**
```bash
# Using Docker
docker run -d --name postgres \
  -e POSTGRES_USER=velvet \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=velvet_sentinel \
  -p 5432:5432 \
  postgres:16-alpine
```

**Option B: Managed PostgreSQL (Production)**
- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [PlanetScale](https://planetscale.com) - For MySQL alternative

---

## Infrastructure Setup

### Docker Compose (Recommended for Development)

Create/update `docker/docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: velvet
      POSTGRES_PASSWORD: password
      POSTGRES_DB: velvet_sentinel
    volumes:
      - postgres_data:/var/lib/postgresql/data

  dashboard:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dashboard
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://velvet:password@postgres:5432/velvet_sentinel
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - postgres

volumes:
  redis_data:
  postgres_data:
```

**Run All Services**:
```bash
cd docker
docker-compose up -d
```

---

## Pending Development Tasks

### Priority 1: Critical for MVP

| Task | Component | Status | Complexity |
|------|-----------|--------|------------|
| Deploy smart contracts to testnet | contracts/ | 🔴 Pending | Medium |
| Connect Phala TEE to production | packages/phala-enclave | 🔴 Pending | High |
| Implement real Cortensor API calls | packages/cortensor-client | 🔴 Pending | Medium |
| Add database migrations | packages/shared-types | 🔴 Pending | Low |

### Priority 2: Important for Production

| Task | Component | Status | Complexity |
|------|-----------|--------|------------|
| Implement Psy Network SDK integration | packages/shared-types | 🟡 Stub Created | High |
| Real ZK proof circuits (snarkjs/bellman) | crates/zk-proofs | 🟡 Placeholder | Very High |
| On-chain TDX quote verification | contracts/ | 🔴 Pending | High |
| WebSocket price feed integration | agents/ | 🟡 Interface Ready | Medium |
| Redis caching for agents | agents/ | 🟡 Interface Ready | Low |

### Priority 3: Nice to Have

| Task | Component | Status | Complexity |
|------|-----------|--------|------------|
| Add comprehensive error handling | all | 🟡 Basic | Medium |
| Implement rate limiting middleware | agents/ | 🔴 Pending | Low |
| Add request logging and tracing | all | 🔴 Pending | Medium |
| Performance monitoring (metrics) | all | 🔴 Pending | Medium |
| Unit tests for all packages | all | 🔴 Pending | High |

---

## Contract Deployment

### Current Contracts

1. **AgentRegistry.sol** - Agent registration and reputation
2. **SyndicateVault.sol** - Multi-agent treasury management

### Deployment Steps

```bash
cd contracts

# 1. Configure network in hardhat.config.ts
# Add your RPC URLs and private key

# 2. Compile contracts
npx hardhat compile

# 3. Check deployer balance
npx hardhat run scripts/check-balance.ts --network <network>

# 4. Deploy to testnet
npx hardhat run scripts/deploy.ts --network sepolia

# 5. Verify on Etherscan (optional)
npx hardhat verify --network sepolia <contract_address> <constructor_args>
```

### Network Configuration

Add to `contracts/hardhat.config.ts`:

```typescript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    accounts: process.env.DEPLOYER_PRIVATE_KEY 
      ? [process.env.DEPLOYER_PRIVATE_KEY] 
      : [],
  },
  baseSepolia: {
    url: "https://sepolia.base.org",
    accounts: process.env.DEPLOYER_PRIVATE_KEY 
      ? [process.env.DEPLOYER_PRIVATE_KEY] 
      : [],
  },
  // Add more networks as needed
}
```

### Contract Environment Variables

```env
# contracts/.env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
DEPLOYER_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=your_etherscan_key
```

---

## Environment Variables Reference

### Dashboard (.env.local)

```env
# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=
THIRDWEB_SECRET_KEY=

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/velvet

# Cache
REDIS_URL=redis://localhost:6379

# API Endpoints (for SSR)
CORTENSOR_API_URL=http://localhost:3001
AGENT_REGISTRY_URL=http://localhost:3002
```

### Agents (.env)

```env
# Agent Identity
AGENT_ID=
AGENT_PRIVATE_KEY=

# Phala TEE
PHALA_ENDPOINT=
PHALA_WORKER_ADDRESS=

# Cortensor
CORTENSOR_NODE_URL=
CORTENSOR_API_KEY=

# Psy Network
PSY_NETWORK_URL=
PSY_CONTRACT_ADDRESS=

# Database & Cache
DATABASE_URL=
REDIS_URL=

# RPC Endpoints (for blockchain queries)
ETHEREUM_RPC_URL=
BSC_RPC_URL=
POLYGON_RPC_URL=
ARBITRUM_RPC_URL=
```

### Contracts (.env)

```env
# Network RPCs
SEPOLIA_RPC_URL=
BASE_SEPOLIA_RPC_URL=

# Deployment
DEPLOYER_PRIVATE_KEY=

# Verification
ETHERSCAN_API_KEY=
BASESCAN_API_KEY=
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Contracts deployed and verified
- [ ] TEE workers provisioned on Phala
- [ ] Redis cluster configured
- [ ] Domain and SSL certificates ready

### Security

- [ ] Private keys stored in secure vault (not in env files)
- [ ] API rate limiting enabled
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
- [ ] Audit logs enabled

### Monitoring

- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

### Testing

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Security audit completed

---

## Support & Resources

- **GitHub**: https://github.com/Shubhojit-17/VelvelSentinal
- **Thirdweb Docs**: https://portal.thirdweb.com
- **Phala Docs**: https://docs.phala.network
- **Hardhat Docs**: https://hardhat.org/docs

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | Jan 2025 | Initial MVP with mock integrations |
| 0.2.0 | Jan 2025 | Added infrastructure (cache, db, ws) |

---

*This document should be updated as integrations are completed and new requirements emerge.*

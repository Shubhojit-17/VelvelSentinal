# Velvet Sentinel - Setup Guide

This guide will help you set up the Velvet Sentinel project on your local machine.

## Prerequisites

### 1. Node.js (v22+)

Download and install Node.js from [nodejs.org](https://nodejs.org/).

**Windows (via Chocolatey):**
```powershell
choco install nodejs-lts
```

**Windows (via Winget):**
```powershell
winget install OpenJS.NodeJS.LTS
```

**macOS (via Homebrew):**
```bash
brew install node@22
```

### 2. pnpm (v10+)

After installing Node.js, enable corepack and install pnpm:

```bash
corepack enable
corepack prepare pnpm@10 --activate
```

Or install globally via npm:

```bash
npm install -g pnpm@10
```

### 3. Rust (v1.91+) - For Psy Protocol components

**Windows:**
Download and run [rustup-init.exe](https://rustup.rs/)

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 4. Docker (Optional - for containerized deployment)

Download from [docker.com](https://www.docker.com/products/docker-desktop/)

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd e:\newproj

# Install all dependencies
pnpm install
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Thirdweb
THIRDWEB_CLIENT_ID=your_client_id_here

# Cortensor
CORTENSOR_API_KEY=your_api_key_here
CORTENSOR_ENDPOINT=https://api.cortensor.network

# Network
NETWORK=arbitrum-sepolia

# Security
SECRET_SALT=your_secret_salt_here
```

### 3. Build All Packages

```bash
pnpm build
```

This will build:
- `@velvet/shared-types`
- `@velvet/phala-enclave`
- `@velvet/cortensor-client`
- `@velvet/x402-payments`
- `@velvet/agent-core`
- `@velvet/sentinel-agent`
- `@velvet/arbitrage-agent`
- `@velvet/governance-agent`
- `@velvet/dashboard`

## Running the Project

### Development Mode

Start all agents in development mode:

```bash
# Terminal 1: Sentinel Agent
cd agents/sentinel-agent
pnpm dev

# Terminal 2: Arbitrage Agent
cd agents/arbitrage-agent
pnpm dev

# Terminal 3: Governance Agent
cd agents/governance-agent
pnpm dev

# Terminal 4: Dashboard
cd dashboard
pnpm dev
```

### Production Mode

Build and start in production:

```bash
# Build all packages
pnpm build

# Start agents
node agents/sentinel-agent/dist/index.js
node agents/arbitrage-agent/dist/index.js
node agents/governance-agent/dist/index.js

# Start dashboard
cd dashboard && pnpm start
```

### Docker Deployment

```bash
cd docker
docker-compose up -d
```

## Accessing the Services

| Service | URL | Description |
|---------|-----|-------------|
| Dashboard | http://localhost:3000 | Web interface |
| Sentinel Agent | http://localhost:3001 | Security monitoring API |
| Arbitrage Agent | http://localhost:3002 | Arbitrage detection API |
| Governance Agent | http://localhost:3003 | DAO governance API |

## API Endpoints

### Sentinel Agent (Port 3001)

- `GET /health` - Health check
- `GET /identity` - Agent identity
- `GET /state` - Agent state
- `POST /scan` - Full security scan (paid)
- `POST /quick-check` - Quick security check (paid)
- `GET /report/:id` - Get scan report
- `GET /alerts` - List recent alerts
- `POST /monitor/start` - Start address monitoring (paid)
- `POST /monitor/stop` - Stop monitoring

### Arbitrage Agent (Port 3002)

- `GET /health` - Health check
- `GET /identity` - Agent identity
- `GET /opportunities` - List arbitrage opportunities
- `GET /opportunity/:id` - Get opportunity details
- `POST /analyze` - AI analysis of opportunity (paid)
- `POST /execute` - Execute arbitrage trade (paid)
- `GET /execution/:id` - Get execution status
- `POST /scan/start` - Start opportunity scanning
- `POST /scan/stop` - Stop scanning
- `GET /prices` - Get current price feeds

### Governance Agent (Port 3003)

- `GET /health` - Health check
- `GET /identity` - Agent identity
- `GET /daos` - List registered DAOs
- `POST /daos/register` - Register a DAO
- `GET /proposals` - List proposals
- `GET /proposal/:id` - Get proposal details
- `POST /analyze` - Analyze proposal (paid)
- `POST /delegate` - Delegate voting power (paid)
- `POST /vote` - Cast vote (paid)
- `GET /votes` - Vote history

## Troubleshooting

### pnpm not found

If pnpm is not recognized after installation, try:

1. Restart your terminal/PowerShell
2. Or run: `npm install -g pnpm`

### Build errors

If you encounter TypeScript errors during build:

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

### Port already in use

Change the port in the agent's environment:

```bash
PORT=3004 node agents/sentinel-agent/dist/index.js
```

## Getting API Keys

### Thirdweb Client ID

1. Go to [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Create a new project
3. Copy the Client ID

### Cortensor API Key

1. Visit [cortensor.network](https://cortensor.network)
2. Sign up for the hackathon
3. Request API access

## Next Steps

1. Configure your environment variables
2. Start the agents
3. Access the dashboard at http://localhost:3000
4. Test the API endpoints

For more information, see the [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md).

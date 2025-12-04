/**
 * Velvet Sentinel - Arbitrage Agent Entry Point
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from project root (try multiple locations)
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(process.cwd(), '../../.env'),
];
envPaths.forEach(path => loadEnv({ path }));

import { serve } from '@hono/node-server';
import { ArbitrageAgent } from './agent.js';
import type { Address } from 'viem';

// Validate required environment variables
function validateEnv() {
  const required = ['THIRDWEB_CLIENT_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('Environment Configuration:');
  console.log(`  - Thirdweb Client ID: ${process.env.THIRDWEB_CLIENT_ID ? '✓ configured' : '✗ missing'}`);
  console.log(`  - Cortensor Endpoint: ${process.env.CORTENSOR_ENDPOINT || 'using default'}`);
  console.log(`  - RPC URL: ${process.env.ARBITRUM_SEPOLIA_RPC_URL ? '✓ configured' : '⚠ using public'}`);
}

validateEnv();

// Default token pairs for demo
const defaultPairs = [
  {
    tokenA: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, // WETH
    tokenB: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address, // USDC
    symbolA: 'WETH',
    symbolB: 'USDC',
  },
  {
    tokenA: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, // WETH
    tokenB: '0x6B175474E89094C44Da98b954EescdeCB5BF3d6F' as Address, // DAI
    symbolA: 'WETH',
    symbolB: 'DAI',
  },
];

// Load environment configuration
const config = {
  id: process.env.AGENT_ID || 'arbitrage-001',
  name: process.env.AGENT_NAME || 'Arbitrage Trading Agent',
  port: Number(process.env.PORT) || 3002,
  minProfitBps: Number(process.env.MIN_PROFIT_BPS) || 30, // 0.3% minimum profit
  maxPositionSize: BigInt(process.env.MAX_POSITION || '1000000000000000000000'), // 1000 tokens
  supportedDexs: (process.env.SUPPORTED_DEXS || 'uniswap,sushiswap,curve').split(','),
  supportedPairs: defaultPairs,
  autoExecute: process.env.AUTO_EXECUTE === 'true',
  tee: {
    endpoint: process.env.DSTACK_ENDPOINT || process.env.DSTACK_SIMULATOR_ENDPOINT,
    network: (process.env.NETWORK || 'arbitrum-sepolia') as 'arbitrum-sepolia' | 'base-sepolia',
    secretSalt: process.env.SECRET_SALT || 'velvet-arbitrage-default-salt',
    chainId: process.env.NETWORK || 'arbitrum-sepolia',
  },
  cortensor: {
    endpoint: process.env.CORTENSOR_ENDPOINT || 'http://127.0.0.1:5010',
    apiKey: process.env.CORTENSOR_API_KEY || 'default-dev-token',
    defaultModel: process.env.CORTENSOR_MODEL || 'llama-3.1-8b',
    fallbackEnabled: true,
  },
  payments: {
    thirdwebClientId: process.env.THIRDWEB_CLIENT_ID || '',
    thirdwebSecretKey: process.env.THIRDWEB_SECRET_KEY,
    defaultNetwork: (process.env.NETWORK || 'arbitrum-sepolia') as 'arbitrum-sepolia' | 'base-sepolia',
    paymentTokens: [
      {
        symbol: 'USDC',
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as Address,
        decimals: 6,
        network: 'arbitrum-sepolia',
      },
    ],
  },
};

async function main() {
  console.log('Starting Velvet Arbitrage Agent...');

  // Create and initialize agent
  const agent = new ArbitrageAgent(config);

  try {
    await agent.initialize();
    await agent.start();

    // Start HTTP server
    const app = agent.getApp();
    serve({
      fetch: app.fetch,
      port: config.port,
    });

    console.log(`Arbitrage Agent running on http://localhost:${config.port}`);
    console.log('Available endpoints:');
    console.log('  GET  /health         - Health check');
    console.log('  GET  /identity       - Agent identity');
    console.log('  GET  /state          - Agent state');
    console.log('  GET  /opportunities  - List arbitrage opportunities');
    console.log('  GET  /opportunity/:id - Get opportunity details');
    console.log('  POST /analyze        - AI analysis of opportunity (paid)');
    console.log('  POST /execute        - Execute arbitrage trade (paid)');
    console.log('  GET  /execution/:id  - Get execution status');
    console.log('  POST /scan/start     - Start opportunity scanning');
    console.log('  POST /scan/stop      - Stop scanning');
    console.log('  GET  /prices         - Get current price feeds');
    console.log('  POST /subscribe      - Subscribe to alerts (paid)');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await agent.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down...');
      await agent.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start Arbitrage Agent:', error);
    process.exit(1);
  }
}

main();

export { ArbitrageAgent } from './agent.js';

/**
 * Velvet Sentinel - Sentinel Agent Entry Point
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
import { SentinelAgent } from './agent.js';

// Validate required environment variables
function validateEnv() {
  const required = ['THIRDWEB_CLIENT_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work properly. See .env.example for required variables.');
  }
  
  // Log configuration status
  console.log('Environment Configuration:');
  console.log(`  - Thirdweb Client ID: ${process.env.THIRDWEB_CLIENT_ID ? '✓ configured' : '✗ missing'}`);
  console.log(`  - Cortensor Endpoint: ${process.env.CORTENSOR_ENDPOINT || 'using default'}`);
  console.log(`  - Cortensor API Key: ${process.env.CORTENSOR_API_KEY && process.env.CORTENSOR_API_KEY !== 'default-dev-token' ? '✓ configured' : '⚠ using default'}`);
  console.log(`  - dStack Endpoint: ${process.env.DSTACK_ENDPOINT || 'http://localhost:8090'}`);
}

validateEnv();

// Load environment configuration
const config = {
  id: process.env.AGENT_ID || 'sentinel-001',
  name: process.env.AGENT_NAME || 'Sentinel Security Agent',
  port: Number(process.env.PORT) || 3001,
  tee: {
    endpoint: process.env.DSTACK_ENDPOINT || process.env.DSTACK_SIMULATOR_ENDPOINT,
    network: (process.env.NETWORK || 'arbitrum-sepolia') as 'arbitrum-sepolia' | 'base-sepolia',
    secretSalt: process.env.SECRET_SALT || 'velvet-sentinel-default-salt',
    chainId: process.env.NETWORK || 'arbitrum-sepolia',
  },
  cortensor: {
    endpoint: process.env.CORTENSOR_ENDPOINT || 'http://127.0.0.1:5010',
    apiKey: process.env.CORTENSOR_API_KEY || 'default-dev-token',
    defaultModel: process.env.CORTENSOR_MODEL || 'llama-3.1-70b',
    fallbackEnabled: true,
  },
  payments: {
    thirdwebClientId: process.env.THIRDWEB_CLIENT_ID || '',
    thirdwebSecretKey: process.env.THIRDWEB_SECRET_KEY,
    defaultNetwork: (process.env.NETWORK || 'arbitrum-sepolia') as 'arbitrum-sepolia' | 'base-sepolia',
    paymentTokens: [
      {
        symbol: 'USDC',
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as `0x${string}`,
        decimals: 6,
        network: 'arbitrum-sepolia',
      },
    ],
  },
};

async function main() {
  console.log('Starting Velvet Sentinel Agent...');

  // Create and initialize agent
  const agent = new SentinelAgent(config);

  try {
    await agent.initialize();
    await agent.start();

    // Start HTTP server
    const app = agent.getApp();
    serve({
      fetch: app.fetch,
      port: config.port,
    });

    console.log(`Sentinel Agent running on http://localhost:${config.port}`);
    console.log('Available endpoints:');
    console.log('  GET  /health     - Health check');
    console.log('  GET  /identity   - Agent identity');
    console.log('  GET  /state      - Agent state');
    console.log('  POST /scan       - Full security scan (paid)');
    console.log('  POST /quick-check - Quick security check (paid)');
    console.log('  GET  /report/:id - Get scan report');
    console.log('  GET  /alerts     - List recent alerts');
    console.log('  POST /monitor/start - Start address monitoring (paid)');
    console.log('  POST /monitor/stop  - Stop monitoring');

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
    console.error('Failed to start Sentinel Agent:', error);
    process.exit(1);
  }
}

main();

export { SentinelAgent } from './agent.js';

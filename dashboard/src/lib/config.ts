import { createThirdwebClient } from 'thirdweb';

// Validate thirdweb client ID
const thirdwebClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!thirdwebClientId) {
  console.warn('[Dashboard] NEXT_PUBLIC_THIRDWEB_CLIENT_ID not set. Some features will be disabled.');
}

// Create thirdweb client only if clientId is available
export const thirdwebClient = thirdwebClientId 
  ? createThirdwebClient({ clientId: thirdwebClientId })
  : null;

// Check if thirdweb is configured
export const isThirdwebConfigured = !!thirdwebClientId;

// Agent endpoints
export const AGENT_ENDPOINTS = {
  sentinel: process.env.NEXT_PUBLIC_SENTINEL_URL || 'http://localhost:3001',
  arbitrage: process.env.NEXT_PUBLIC_ARBITRAGE_URL || 'http://localhost:3002',
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_URL || 'http://localhost:3003',
};

// App configuration
export const APP_CONFIG = {
  name: 'Velvet Sentinel',
  description: 'Autonomous DeFi Intelligence Syndicate',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

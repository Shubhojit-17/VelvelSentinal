/**
 * Velvet Sentinel - Phala dStack TEE Integration
 * 
 * Provides secure enclave operations using Phala's dStack SDK
 * Uses DstackClient (NOT deprecated TappdClient)
 * 
 * @see https://docs.phala.com/dstack/getting-started
 */

import { DstackClient } from '@phala/dstack-sdk';
import { toViemAccountSecure } from '@phala/dstack-sdk/viem';
import { 
  createWalletClient, 
  createPublicClient,
  http, 
  type Chain, 
  type WalletClient,
  type PublicClient,
  type Account,
  type Hex,
} from 'viem';
import { mainnet, arbitrum, arbitrumSepolia, baseSepolia } from 'viem/chains';
import type { TEEAttestation, TEEKeyResult } from '@velvet/shared-types';

// Configuration interface
export interface TEEConfig {
  endpoint?: string;
  chainId?: string;
  keyPath?: string;
  network?: 'arbitrum-sepolia' | 'base-sepolia';
  secretSalt?: string;
}

// Derived wallet result
export interface DerivedWallet {
  address: Hex;
  publicKey: Hex;
  account: Account;
}

// Supported chains with RPC URLs from env
const getChains = (): Record<string, Chain> => {
  const infuraKey = process.env.INFURA_API_KEY || process.env.ARBITRUM_SEPOLIA_RPC_URL?.split('/').pop() || '';
  
  return {
    mainnet: {
      ...mainnet,
      rpcUrls: {
        ...mainnet.rpcUrls,
        default: { http: [process.env.ETHEREUM_RPC_URL || `https://mainnet.infura.io/v3/${infuraKey}`] },
      },
    },
    arbitrum: {
      ...arbitrum,
      rpcUrls: {
        ...arbitrum.rpcUrls,
        default: { http: [process.env.ARBITRUM_RPC_URL || `https://arbitrum-mainnet.infura.io/v3/${infuraKey}`] },
      },
    },
    'arbitrum-sepolia': {
      ...arbitrumSepolia,
      rpcUrls: {
        ...arbitrumSepolia.rpcUrls,
        default: { http: [process.env.ARBITRUM_SEPOLIA_RPC_URL || `https://arbitrum-sepolia.infura.io/v3/${infuraKey}`] },
      },
    },
    'base-sepolia': {
      ...baseSepolia,
      rpcUrls: {
        ...baseSepolia.rpcUrls,
        default: { http: [process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'] },
      },
    },
  };
};

/**
 * TEE Worker - Manages secure operations within Phala dStack enclave
 * 
 * IMPORTANT: 
 * - Production: auto-connects to /var/run/dstack.sock
 * - Development: uses DSTACK_SIMULATOR_ENDPOINT env var
 * - Always use toViemAccountSecure() - legacy toViemAccount() has security vulnerabilities
 */
export class TEEWorker {
  private client: DstackClient;
  private isConnected: boolean = false;
  private config: TEEConfig;
  private defaultChainId: string;

  constructor(config?: TEEConfig | string) {
    // Support both string endpoint and config object for backwards compatibility
    if (typeof config === 'string') {
      this.config = { endpoint: config };
    } else {
      this.config = config || {};
    }
    
    this.defaultChainId = this.config.chainId || 'arbitrum-sepolia';
    
    // DstackClient auto-detects endpoint:
    // - Production: /var/run/dstack.sock
    // - Dev: DSTACK_SIMULATOR_ENDPOINT env var
    // - Or explicit endpoint parameter
    this.client = new DstackClient(this.config.endpoint);
  }

  /**
   * Initialize the TEE worker (connect to dStack)
   * Returns silently if dStack is not available (dev mode)
   */
  async initialize(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      console.warn('[TEEWorker] dStack not available. Running in development mode.');
      this.isConnected = false;
    }
  }

  /**
   * Check if dStack service is reachable
   */
  async connect(): Promise<boolean> {
    try {
      this.isConnected = await this.client.isReachable();
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      throw error; // Propagate for callers that need to handle it
    }
  }

  /**
   * Get TEE instance information
   */
  async getInfo(): Promise<{
    app_id: string;
    instance_id: string;
    app_name: string;
  }> {
    const info = await this.client.info();
    return {
      app_id: info.app_id,
      instance_id: info.instance_id,
      app_name: info.app_name,
    };
  }

  /**
   * Derive a deterministic wallet key from TEE
   * Uses secp256k1 curve - compatible with Ethereum, Bitcoin, Solana
   * 
   * @param path - Unique path for key derivation (e.g., 'wallet/ethereum')
   * @param purpose - Additional context (e.g., 'mainnet', 'trading')
   */
  async deriveKey(path: string, purpose: string = ''): Promise<TEEKeyResult> {
    const result = await this.client.getKey(path, purpose);
    return {
      key: result.key,
      signature_chain: result.signature_chain,
    };
  }

  /**
   * Derive a wallet with address and public key
   * Convenience method that wraps getSecureWallet
   * 
   * @param path - Unique path for key derivation
   */
  async deriveWallet(path: string): Promise<DerivedWallet> {
    const { account, address } = await this.getSecureWallet(
      this.defaultChainId,
      path
    );
    
    // Get public key from account
    const publicKey = account.publicKey ?? ('0x' as Hex);
    
    return {
      address: address as Hex,
      publicKey,
      account,
    };
  }

  /**
   * Get a secure Viem wallet client for blockchain transactions
   * 
   * SECURITY: Uses toViemAccountSecure() with SHA256 hashing
   * DO NOT use legacy toViemAccount() - has vulnerabilities
   * 
   * @param chainId - Chain identifier ('mainnet', 'arbitrum', 'arbitrum-sepolia')
   * @param keyPath - Key derivation path
   * @param rpcUrl - Optional custom RPC URL
   */
  async getSecureWallet(
    chainId: string,
    keyPath: string = 'wallet/main',
    rpcUrl?: string
  ): Promise<{
    wallet: WalletClient;
    public: PublicClient;
    account: Account;
    address: string;
  }> {
    const chains = getChains();
    const chain = chains[chainId];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}. Supported: ${Object.keys(chains).join(', ')}`);
    }

    const keyResult = await this.client.getKey(keyPath, chainId);
    
    // ⚠️ MUST use toViemAccountSecure - legacy version has security vulnerabilities
    const account = toViemAccountSecure(keyResult);

    // Use provided RPC URL or chain default
    const transport = http(rpcUrl || chain.rpcUrls.default.http[0]);

    const walletClient = createWalletClient({
      account,
      chain,
      transport,
    });

    const publicClient = createPublicClient({
      chain,
      transport,
    });

    return {
      wallet: walletClient,
      public: publicClient,
      account,
      address: account.address,
    };
  }

  /**
   * Generate TDX attestation quote
   * 
   * NOTE: reportData must be ≤ 64 bytes
   * For larger data, hash it first before calling this method
   * 
   * @param reportData - Data to include in quote (max 64 bytes), defaults to timestamp
   */
  async getAttestation(reportData?: string | Uint8Array): Promise<TEEAttestation> {
    // Default to timestamp if no data provided
    const data = reportData ?? new Date().toISOString();
    
    // Validate data size
    const dataBytes = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data;
    
    if (dataBytes.length > 64) {
      throw new Error(`reportData must be ≤ 64 bytes, got ${dataBytes.length}. Hash larger data first.`);
    }

    const quote = await this.client.getQuote(data);
    
    return {
      quote: quote.quote,
      event_log: quote.event_log,
      rtmrs: quote.replayRtmrs(), // SDK already returns string[]
    };
  }

  /**
   * Generate TLS certificate for secure connections
   * 
   * NOTE: Each call generates a NEW random key - not deterministic
   * Use for TLS/SSL only, not for persistent identities
   * 
   * @param options - TLS key generation options
   */
  async getTlsCertificate(options: {
    subject: string;
    altNames?: string[];
    useRaTls?: boolean;
  }): Promise<{
    privateKey: string;
    certificateChain: string[];
  }> {
    const result = await this.client.getTlsKey({
      subject: options.subject,
      altNames: options.altNames || [],
      usageRaTls: options.useRaTls || false,
      usageServerAuth: true,
      usageClientAuth: false,
    });

    return {
      privateKey: result.key,
      certificateChain: result.certificate_chain,
    };
  }

  /**
   * Emit custom event for audit logging (extends RTMR3)
   * 
   * NOTE: Requires dstack OS 0.5.0+
   * Events are permanently recorded in TEE measurements
   */
  async emitAuditEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.client.emitEvent(eventType, JSON.stringify(payload));
  }

  /**
   * Sign data securely within TEE
   */
  async signMessage(
    chainId: string,
    message: string,
    keyPath: string = 'signing/main'
  ): Promise<string> {
    const { wallet, account } = await this.getSecureWallet(chainId, keyPath);
    return wallet.signMessage({ account, message });
  }

  /**
   * Check connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

// Export chain configurations for convenience
export { getChains as CHAINS };

// Re-export types from shared-types
export type { TEEAttestation, TEEKeyResult };

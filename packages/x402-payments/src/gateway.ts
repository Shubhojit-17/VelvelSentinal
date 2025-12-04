/**
 * Velvet Sentinel - x402 Payment Gateway
 *
 * Implements HTTP 402 Payment Required protocol for agent micropayments
 * using x402 + thirdweb for wallet management
 * 
 * @see https://portal.thirdweb.com/x402
 * @see https://x402.org
 */

import { createThirdwebClient, type ThirdwebClient } from 'thirdweb';
import { arbitrumSepolia, baseSepolia } from 'thirdweb/chains';
import type { Address, Hex } from 'viem';
import type { X402Payment, PaymentReceipt, PaymentToken } from '@velvet/shared-types';

// x402 payment response type
export interface X402PaymentChallenge {
  version: '0.7';
  accepts: PaymentAccept[];
  x402Version: number;
  error?: string;
}

export interface PaymentAccept {
  scheme: 'exact';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  asset: Address;
  extra?: Record<string, unknown>;
}

export interface PaymentProof {
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: {
    signature: Hex;
    authorization: {
      from: Address;
      to: Address;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: Hex;
    };
  };
}

export interface X402GatewayConfig {
  thirdwebClientId: string;
  thirdwebSecretKey?: string;
  facilitatorUrl?: string;
  defaultNetwork: 'arbitrum-sepolia' | 'base-sepolia';
  paymentTokens: PaymentToken[];
}

/**
 * X402PaymentGateway - Handles micropayments using HTTP 402 protocol
 */
export class X402PaymentGateway {
  private client: ThirdwebClient;
  private config: X402GatewayConfig;
  private pendingPayments: Map<string, X402Payment> = new Map();
  private initialized: boolean = false;

  constructor(config: X402GatewayConfig) {
    this.config = config;
    
    // Validate required configuration
    if (!config.thirdwebClientId) {
      console.warn('[X402Gateway] No thirdwebClientId provided. Payment features will be limited.');
    }
    
    // Create thirdweb client - prefer secretKey for server-side, clientId for client-side
    if (config.thirdwebSecretKey) {
      this.client = createThirdwebClient({
        secretKey: config.thirdwebSecretKey,
      });
      this.initialized = true;
    } else if (config.thirdwebClientId) {
      this.client = createThirdwebClient({
        clientId: config.thirdwebClientId,
      });
      this.initialized = true;
    } else {
      // Create a placeholder client - will fail on actual payment operations
      this.client = createThirdwebClient({
        clientId: 'placeholder-will-fail',
      });
      this.initialized = false;
    }
  }

  /**
   * Check if gateway is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the supported chains for payments
   */
  getSupportedChains() {
    return {
      'arbitrum-sepolia': arbitrumSepolia,
      'base-sepolia': baseSepolia,
    };
  }

  /**
   * Create a payment challenge (402 response)
   */
  createPaymentChallenge(params: {
    resource: string;
    amount: bigint;
    payTo: Address;
    description?: string;
    timeoutSeconds?: number;
    asset?: Address;
  }): X402PaymentChallenge {
    const network = this.config.defaultNetwork;
    const chain = this.getSupportedChains()[network];

    // USDC addresses for testnets
    const usdcAddresses: Record<string, Address> = {
      'arbitrum-sepolia': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    };

    return {
      version: '0.7',
      x402Version: 1,
      accepts: [
        {
          scheme: 'exact',
          network: `eip155:${chain.id}`,
          maxAmountRequired: params.amount.toString(),
          resource: params.resource,
          description: params.description,
          payTo: params.payTo,
          maxTimeoutSeconds: params.timeoutSeconds || 300,
          asset: params.asset || usdcAddresses[network],
        },
      ],
    };
  }

  /**
   * Verify a payment proof from client
   */
  async verifyPaymentProof(
    proof: PaymentProof,
    expectedResource: string
  ): Promise<{ valid: boolean; receipt?: PaymentReceipt; error?: string }> {
    try {
      // Validate proof structure
      if (proof.x402Version !== 1 || proof.scheme !== 'exact') {
        return { valid: false, error: 'Invalid proof version or scheme' };
      }

      // Validate authorization
      const auth = proof.payload.authorization;
      const now = Math.floor(Date.now() / 1000);

      if (BigInt(auth.validAfter) > now) {
        return { valid: false, error: 'Payment not yet valid' };
      }

      if (BigInt(auth.validBefore) < now) {
        return { valid: false, error: 'Payment expired' };
      }

      // In production, verify signature on-chain or via facilitator
      // For now, create a receipt
      const receipt: PaymentReceipt = {
        id: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        paymentId: auth.nonce,
        status: 'confirmed',
        confirmedAt: new Date(),
        transactionHash: proof.payload.signature, // In production, this would be actual tx hash
      };

      return { valid: true, receipt };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Create a payment request for an agent service
   */
  async createPaymentRequest(params: {
    agentId: string;
    serviceType: string;
    amount: bigint;
    payTo: Address;
    metadata?: Record<string, unknown>;
  }): Promise<X402Payment> {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const payment: X402Payment = {
      id: paymentId,
      agentId: params.agentId,
      amount: params.amount,
      token: this.config.paymentTokens[0] || {
        symbol: 'USDC',
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as Address,
        decimals: 6,
        network: 'arbitrum-sepolia',
      },
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      metadata: {
        serviceType: params.serviceType,
        ...params.metadata,
      },
    };

    this.pendingPayments.set(paymentId, payment);
    return payment;
  }

  /**
   * Get payment status
   */
  getPayment(paymentId: string): X402Payment | undefined {
    return this.pendingPayments.get(paymentId);
  }

  /**
   * Update payment status
   */
  updatePaymentStatus(
    paymentId: string,
    status: X402Payment['status'],
    receipt?: PaymentReceipt
  ): boolean {
    const payment = this.pendingPayments.get(paymentId);
    if (!payment) return false;

    payment.status = status;
    if (receipt) {
      payment.metadata = { ...payment.metadata, receipt };
    }

    this.pendingPayments.set(paymentId, payment);
    return true;
  }

  /**
   * Format amount for display (handles decimals)
   */
  formatAmount(amount: bigint, decimals: number = 6): string {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0');
    return `${whole}.${fractionStr}`;
  }

  /**
   * Parse amount from string to bigint
   */
  parseAmount(amount: string, decimals: number = 6): bigint {
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
  }

  /**
   * Get thirdweb client for wallet operations
   */
  getThirdwebClient(): ThirdwebClient {
    return this.client;
  }
}

/**
 * Create 402 Payment Required headers
 */
export function create402Headers(challenge: X402PaymentChallenge): Headers {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('X-Payment-Required', 'true');
  headers.set('X-402-Version', '0.7');
  return headers;
}

/**
 * Parse X-PAYMENT header from request
 */
export function parsePaymentHeader(header: string): PaymentProof | null {
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decoded) as PaymentProof;
  } catch {
    return null;
  }
}

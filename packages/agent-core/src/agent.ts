/**
 * Velvet Sentinel - Base Agent Class
 *
 * Abstract base class for all Velvet agents with TEE, AI, and payment integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { keccak256, toBytes } from 'viem';
import type { Address, Hex } from 'viem';

import { TEEWorker, type TEEConfig } from '@velvet/phala-enclave';
import { CortensorClient, type CortensorConfig } from '@velvet/cortensor-client';
import {
  X402PaymentGateway,
  x402Middleware,
  type X402GatewayConfig,
  type PricingStrategy,
} from '@velvet/x402-payments';
import type {
  AgentIdentity,
  AgentType,
  AgentCapability,
  RegisteredAgent,
  ReputationScore,
} from '@velvet/shared-types';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[] | string[];
  port: number;
  tee: TEEConfig;
  cortensor: CortensorConfig;
  payments: X402GatewayConfig;
  syndicate?: {
    id: string;
    role: 'leader' | 'member';
  };
}

export interface AgentState {
  status: 'initializing' | 'ready' | 'busy' | 'error' | 'shutdown';
  lastActivity: Date;
  tasksCompleted: number;
  reputation: ReputationScore;
  earnings: bigint;
}

/**
 * BaseAgent - Foundation for all Velvet agents
 */
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected state: AgentState;
  protected app: Hono;
  protected tee: TEEWorker;
  protected cortensor: CortensorClient;
  protected payments: X402PaymentGateway;
  protected identity?: AgentIdentity;
  protected wallet?: { address: Address; publicKey: Hex };

  constructor(config: AgentConfig) {
    this.config = config;

    // Initialize state
    this.state = {
      status: 'initializing',
      lastActivity: new Date(),
      tasksCompleted: 0,
      reputation: {
        overall: 0,
        reliability: 0,
        accuracy: 0,
        speed: 0,
        costEfficiency: 0,
      },
      earnings: 0n,
    };

    // Initialize components
    this.tee = new TEEWorker(config.tee);
    this.cortensor = new CortensorClient(config.cortensor);
    this.payments = new X402PaymentGateway(config.payments);

    // Initialize Hono app
    this.app = new Hono();
    this.setupMiddleware();
    this.setupBaseRoutes();
  }

  /**
   * Initialize the agent (call this before starting)
   */
  async initialize(): Promise<void> {
    try {
      // Try to initialize TEE - gracefully handle if not available
      let teeAvailable = false;
      try {
        await this.tee.initialize();
        teeAvailable = this.tee.connected;
      } catch (teeError) {
        console.warn(`[${this.config.name}] TEE not available (dStack not running). Running in development mode.`);
      }

      if (teeAvailable) {
        // Production mode: derive wallet from TEE
        const derivedWallet = await this.tee.deriveWallet(`velvet-agent-${this.config.id}`);
        this.wallet = derivedWallet;

        // Create agent identity with attestation
        this.identity = {
          id: this.config.id,
          name: this.config.name,
          version: '0.1.0',
          owner: derivedWallet.address,
          publicKey: derivedWallet.publicKey,
          attestation: await this.tee.getAttestation(),
          registeredAt: new Date(),
          lastSeen: new Date(),
        };

        console.log(`Agent ${this.config.name} initialized with TEE. Address: ${derivedWallet.address}`);
      } else {
        // Development mode: generate deterministic wallet from agent ID
        // Use keccak256 hash of agent ID + salt as private key (deterministic but secure)
        const salt = this.config.tee.secretSalt || 'velvet-dev-salt';
        const seedData = `${this.config.id}:${salt}`;
        const privateKey = keccak256(toBytes(seedData)) as Hex;
        const devAccount = privateKeyToAccount(privateKey);
        
        this.wallet = {
          address: devAccount.address,
          publicKey: devAccount.publicKey,
        };

        // Create agent identity without TEE attestation
        this.identity = {
          id: this.config.id,
          name: this.config.name,
          version: '0.1.0',
          owner: devAccount.address,
          publicKey: devAccount.publicKey,
          attestation: {
            quote: 'dev-mode-no-tee-attestation',
            event_log: '',
            rtmrs: [],
          },
          registeredAt: new Date(),
          lastSeen: new Date(),
        };

        console.log(`Agent ${this.config.name} initialized in DEV mode. Address: ${devAccount.address}`);
        console.warn(`[WARNING] Running without TEE protection. Use only for development.`);
      }

      // Call subclass initialization
      await this.onInitialize();

      this.state.status = 'ready';
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  /**
   * Start the agent HTTP server
   */
  async start(): Promise<void> {
    if (this.state.status !== 'ready') {
      throw new Error('Agent must be initialized before starting');
    }

    // Setup agent-specific routes
    await this.setupRoutes();

    console.log(`Agent ${this.config.name} starting on port ${this.config.port}`);

    // Note: Actual server start depends on runtime (Node.js, Bun, Deno, etc.)
    // This provides the Hono app that can be used with any adapter
  }

  /**
   * Get the Hono app for server adapter
   */
  getApp(): Hono {
    return this.app;
  }

  /**
   * Setup base middleware
   */
  private setupMiddleware(): void {
    this.app.use('*', logger());
    this.app.use(
      '*',
      cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-PAYMENT'],
      })
    );
  }

  /**
   * Setup base routes (health, identity, etc.)
   */
  private setupBaseRoutes(): void {
    // Health check
    this.app.get('/health', (c) => {
      return c.json({
        status: this.state.status,
        timestamp: new Date().toISOString(),
      });
    });

    // Agent identity
    this.app.get('/identity', (c) => {
      if (!this.identity) {
        return c.json({ error: 'Agent not initialized' }, 500);
      }

      return c.json({
        id: this.identity.id,
        name: this.config.name,
        type: this.config.type,
        capabilities: this.config.capabilities,
        address: this.wallet?.address,
        publicKey: this.identity.publicKey,
      });
    });

    // Agent state
    this.app.get('/state', (c) => {
      return c.json({
        status: this.state.status,
        lastActivity: this.state.lastActivity,
        tasksCompleted: this.state.tasksCompleted,
        reputation: this.state.reputation,
        earnings: this.state.earnings.toString(),
      });
    });

    // Attestation (for TEE verification)
    this.app.get('/attestation', async (c) => {
      try {
        const attestation = await this.tee.getAttestation();
        return c.json({ attestation });
      } catch (error) {
        return c.json({ error: 'Failed to get attestation' }, 500);
      }
    });
  }

  /**
   * Create a protected route that requires payment
   */
  protected paidRoute(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    pricing: PricingStrategy,
    handler: (c: any) => Promise<Response>
  ): void {
    if (!this.wallet) {
      throw new Error('Agent wallet not initialized');
    }

    const middleware = x402Middleware({
      gateway: this.payments,
      payTo: this.wallet.address,
      pricing,
    });

    this.app[method](path, middleware, handler);
  }

  /**
   * Request AI inference via Cortensor
   */
  protected async requestAI(
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<{ content: string; evidenceId: string }> {
    const response = await this.cortensor.inference(prompt, {
      model: options?.model || 'llama-3.1-8b',
      maxTokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      requirePoI: true,
    });

    return {
      content: response.content,
      evidenceId: response.evidence_bundle_cid || response.response_id,
    };
  }

  /**
   * Sign data with TEE-secured key (or dev wallet in dev mode)
   */
  protected async sign(data: string | Uint8Array): Promise<Hex> {
    const message = typeof data === 'string' ? data : Buffer.from(data).toString();
    
    if (this.tee.connected) {
      // Production: sign with TEE
      const signature = await this.tee.signMessage(
        this.config.tee.chainId || 'arbitrum-sepolia',
        message
      );
      return signature as Hex;
    } else {
      // Development: sign with dev wallet
      const salt = this.config.tee.secretSalt || 'velvet-dev-salt';
      const seedData = `${this.config.id}:${salt}`;
      const privateKey = keccak256(toBytes(seedData)) as Hex;
      const devAccount = privateKeyToAccount(privateKey);
      const signature = await devAccount.signMessage({ message });
      return signature;
    }
  }

  /**
   * Update agent state
   */
  protected updateState(updates: Partial<AgentState>): void {
    this.state = { ...this.state, ...updates, lastActivity: new Date() };
  }

  /**
   * Record task completion
   */
  protected recordTask(earnings: bigint = 0n): void {
    this.state.tasksCompleted++;
    this.state.earnings += earnings;
    this.state.lastActivity = new Date();
  }

  /**
   * Get registered agent info
   */
  getRegisteredAgent(): RegisteredAgent | null {
    if (!this.identity || !this.wallet) return null;

    return {
      identity: this.identity,
      metadata: {
        name: this.config.name,
        description: `${this.config.type} agent`,
        version: '0.1.0',
        capabilities: this.config.capabilities,
        pricing: {
          baseRate: 100n, // 0.0001 USDC per request
          currency: 'USDC',
        },
      },
      endpoint: `http://localhost:${this.config.port}`,
      status: this.state.status === 'ready' ? 'active' : 'inactive',
    };
  }

  /**
   * Abstract methods for subclasses to implement
   */
  protected abstract onInitialize(): Promise<void>;
  protected abstract setupRoutes(): Promise<void>;

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.state.status = 'shutdown';
    console.log(`Agent ${this.config.name} shutting down...`);
  }
}

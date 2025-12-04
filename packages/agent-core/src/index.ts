/**
 * Velvet Sentinel - Agent Core Package
 */

// Base agent
export { BaseAgent, type AgentConfig, type AgentState } from './agent.js';

// Syndicate management
export { SyndicateManager, type SyndicateState } from './syndicate.js';

// Re-export from dependencies for convenience
export type {
  AgentIdentity,
  AgentType,
  AgentCapability,
  RegisteredAgent,
  ReputationScore,
  SyndicateConfig,
  SyndicateMember,
  SyndicateTask,
  TaskAssignment,
} from '@velvet/shared-types';

export { TEEWorker, type TEEConfig } from '@velvet/phala-enclave';
export { CortensorClient, type CortensorConfig } from '@velvet/cortensor-client';
export {
  X402PaymentGateway,
  x402Middleware,
  type X402GatewayConfig,
  type PricingStrategy,
} from '@velvet/x402-payments';

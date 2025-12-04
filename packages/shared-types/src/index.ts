/**
 * Velvet Sentinel - Shared Types
 * Common type definitions used across all packages
 */

// ============================================
// Agent Types
// ============================================

export type AgentType = 
  | 'security'
  | 'trading'
  | 'governance'
  | 'monitoring'
  | 'analytics'
  | 'coordinator';

export interface AgentIdentity {
  id: string;
  name: string;
  version: string;
  owner: string;
  attestationHash?: string;
  sdKeyId?: string;
  publicKey?: string;
  attestation?: TEEAttestation | string;
  registeredAt?: Date;
  lastSeen?: Date;
}

export interface ReputationScore {
  overall: number;
  reliability: number;
  accuracy: number;
  speed: number;
  costEfficiency: number;
}

export interface RegisteredAgent {
  identity: AgentIdentity;
  metadata: {
    name: string;
    description: string;
    version: string;
    capabilities: AgentCapability[] | string[];
    pricing: {
      baseRate: bigint;
      currency: string;
    };
  };
  endpoint: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AgentCapability {
  name: string;
  description: string;
  pricing: X402Pricing;
  parameters: Record<string, ParameterDefinition>;
}

export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface AgentManifest {
  agent_id: string;
  name: string;
  version: string;
  description: string;
  tools: MCPTool[];
  resources: MCPResource[];
  attestation?: AgentAttestation;
}

// ============================================
// MCP (Model Context Protocol) Types
// ============================================

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, MCPParameterProperty>;
    required: string[];
  };
  pricing?: X402Pricing;
}

export interface MCPParameterProperty {
  type: string;
  description: string;
  enum?: string[];
}

export interface MCPResource {
  name: string;
  description: string;
  uri: string;
  mimeType: string;
}

export interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'error';
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

// ============================================
// x402 Payment Types
// ============================================

export interface X402Pricing {
  protocol: 'x402';
  amount: string;
  currency: 'ETH' | 'USDC' | 'COR' | 'PSY';
  per?: 'call' | 'alert' | 'day' | 'hour';
}

export interface X402PaymentRequest {
  payment_id: string;
  amount: string;
  currency: string;
  recipient_address: string;
  recipient_agent_id: string;
  service: {
    tool_name: string;
    parameters_hash: string;
    expected_response_type: string;
  };
  expires_at: number;
  settlement_chains: ('psy' | 'ethereum' | 'arbitrum')[];
  escrow?: {
    enabled: boolean;
    release_conditions: string[];
    dispute_resolver: string;
  };
}

export interface X402PaymentResponse {
  payment_id: string;
  status: 'confirmed' | 'pending' | 'failed';
  tx_hash: string;
  settlement_chain: string;
  confirmed_at: number;
  service_response?: unknown;
  evidence_bundle_cid?: string;
}

export interface PaymentToken {
  symbol: string;
  address: string;
  decimals: number;
  network: string;
}

export interface X402Payment {
  id: string;
  agentId: string;
  amount: bigint;
  token: PaymentToken;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmedAt?: Date;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: bigint;
}

// ============================================
// Cortensor Types
// ============================================

export interface CortensorSession {
  session_id: string;
  node_ids: string[];
  inference_type: 'single' | 'consensus';
  poi_required: boolean;
  pouw_validation: boolean;
}

export interface CortensorInferenceRequest {
  prompt: string;
  model?: string;
  poi_required?: boolean;
  consensus_nodes?: number;
  max_tokens?: number;
  temperature?: number;
}

export interface CortensorInferenceResponse {
  response_id: string;
  content: string;
  model: string;
  poi_attestations?: POIAttestation[];
  evidence_bundle_cid?: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface POIAttestation {
  node_id: string;
  signature: string;
  score: number;
  timestamp: number;
}

export interface EvidenceBundle {
  bundle_id: string;
  timestamp: string;
  agent_id: string;
  request: {
    type: string;
    query_hash: string;
    parameters: Record<string, unknown>;
  };
  response: {
    response_hash: string;
    summary: string;
    confidence: number;
  };
  verification: {
    poi_consensus: boolean;
    nodes_queried: number;
    nodes_agreed: number;
    node_attestations: POIAttestation[];
  };
  storage: {
    ipfs_cid: string;
    arweave_tx?: string;
  };
}

// ============================================
// Phala TEE Types
// ============================================

export interface TEEAttestation {
  quote: string;
  event_log: string;
  rtmrs: string[];
}

export interface TEEKeyResult {
  key: Uint8Array;
  signature_chain: Uint8Array[];
}

export interface AgentAttestation {
  phala_report_cid?: string;
  psy_sdkey?: string;
  cortensor_reputation?: number;
  verified_since?: string;
}

// ============================================
// Psy Protocol Types
// ============================================

export interface SDKeyIdentity {
  id: Uint8Array;
  permissions: SDKeyPermissions;
  delegations: SDKeyDelegation[];
}

export interface SDKeyPermissions {
  max_trade_size_usd: number;
  allowed_protocols: string[];
  allowed_tokens: string[];
  daily_loss_limit_bps: number;
  can_use_leverage: boolean;
  max_leverage: number;
  active_hours?: {
    start: number;
    end: number;
  };
  approval_threshold_usd?: number;
}

export interface SDKeyDelegation {
  delegatee: string;
  permissions: Partial<SDKeyPermissions>;
  expires_at: number;
}

export interface ZKPerformanceProof {
  period_start: number;
  period_end: number;
  pnl_proof: string;
  sharpe_ratio_proof: string;
  max_drawdown_proof: string;
  trade_count_proof: string;
  verification_tx?: string;
  verified_at?: number;
}

// ============================================
// Syndicate Types
// ============================================

export interface Syndicate {
  id: string;
  name: string;
  strategy: SyndicateStrategy;
  members: SyndicateMember[];
  contracts: SyndicateContracts;
  operations: SyndicateOperations;
  created_at: number;
}

export interface SyndicateStrategy {
  name: string;
  objective: string;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  target_return: string;
}

export interface SyndicateMember {
  agent_id: string;
  role: string;
  weight: number;
  pricing: X402Pricing;
  reputation: number | ReputationScore;
  status?: 'active' | 'inactive' | 'suspended';
  capabilities?: string[];
}

export interface SyndicateConfig {
  id?: string;
  name: string;
  description?: string;
  strategy: SyndicateStrategy;
  maxMembers: number;
  minReputation?: number;
  requiredCapabilities?: string[];
}

export interface SyndicateTask {
  id: string;
  syndicateId: string;
  type: string;
  description: string;
  requiredCapabilities: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';
  reward?: bigint;
  deadline?: Date;
  createdAt: Date;
  completedAt?: Date;
  result?: unknown;
  assignments?: TaskAssignment[];
}

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  assignedAt: Date;
  status: 'assigned' | 'accepted' | 'in-progress' | 'completed' | 'failed';
  completedAt?: Date;
  result?: unknown;
}

export interface SyndicateContracts {
  vault: string;
  revenue_split: string;
  governance?: string;
}

export interface SyndicateOperations {
  decision_threshold: number;
  rebalance_frequency: string;
  max_position_size: string;
  stop_loss: string;
}

// ============================================
// DeFi Types
// ============================================

export interface WhaleMovement {
  tx_hash: string;
  wallet_address: string;
  token: string;
  amount: string;
  amount_usd: number;
  direction: 'in' | 'out';
  protocol?: string;
  timestamp: number;
}

export interface SentimentScore {
  token: string;
  score: number; // -100 to 100
  confidence: number;
  sources: {
    twitter: number;
    discord: number;
    telegram: number;
    news: number;
  };
  timestamp: number;
}

export interface RiskAssessment {
  position_id: string;
  health_factor: number;
  liquidation_price: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  timestamp: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: number;
    request_id: string;
    evidence_cid?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

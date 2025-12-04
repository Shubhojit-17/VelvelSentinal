/**
 * Psy Protocol Integration - Velvet Sentinel
 * 
 * Connects to Psy Network for decentralized agent coordination,
 * reputation management, and cross-chain communication.
 */

import { AgentIdentity, ReputationScore } from './index.js';

// ============================================
// Psy Protocol Types
// ============================================

export interface PsyConfig {
  networkUrl: string;
  contractAddress: string;
  privateKey?: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
}

export interface PsyAgentRegistration {
  agentId: string;
  owner: string;
  teeAttestation: string;
  capabilities: string[];
  stakingAmount: bigint;
  metadata: {
    name: string;
    description: string;
    version: string;
    endpoint?: string;
  };
}

export interface PsyReputationUpdate {
  agentId: string;
  taskId: string;
  outcome: 'success' | 'failure' | 'partial';
  score: number;
  evidence: string; // IPFS CID or on-chain reference
  timestamp: number;
}

export interface PsySlashingEvent {
  agentId: string;
  reason: 'malicious_behavior' | 'false_attestation' | 'service_unavailable' | 'poor_performance';
  severity: 'minor' | 'major' | 'critical';
  slashedAmount: bigint;
  evidence: string[];
  timestamp: number;
}

export interface PsyStakingInfo {
  agentId: string;
  totalStaked: bigint;
  lockedUntil: number;
  delegatedFrom: string[];
  rewards: bigint;
  slashingHistory: PsySlashingEvent[];
}

export interface PsyTaskAssignment {
  taskId: string;
  taskType: 'arbitrage' | 'governance' | 'monitoring' | 'security' | 'analytics';
  requiredCapabilities: string[];
  reward: bigint;
  deadline: number;
  assignedAgents: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  results?: {
    agentId: string;
    result: unknown;
    timestamp: number;
  }[];
}

export interface PsySyndicateConfig {
  syndicateId: string;
  name: string;
  members: string[];
  votingThreshold: number; // Percentage required for consensus
  minStakeRequired: bigint;
  rewardDistribution: 'equal' | 'stake_weighted' | 'performance_based';
  createdAt: number;
}

// ============================================
// Psy Protocol Interface
// ============================================

export interface IPsyConnector {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Agent Management
  registerAgent(registration: PsyAgentRegistration): Promise<string>;
  updateAgentCapabilities(agentId: string, capabilities: string[]): Promise<void>;
  deregisterAgent(agentId: string): Promise<void>;
  getAgent(agentId: string): Promise<AgentIdentity | null>;
  listAgents(filter?: { capabilities?: string[]; minReputation?: number }): Promise<AgentIdentity[]>;
  
  // Reputation
  submitReputationUpdate(update: PsyReputationUpdate): Promise<void>;
  getReputation(agentId: string): Promise<ReputationScore>;
  getReputationHistory(agentId: string, limit?: number): Promise<PsyReputationUpdate[]>;
  
  // Staking
  stake(agentId: string, amount: bigint): Promise<string>;
  unstake(agentId: string, amount: bigint): Promise<string>;
  getStakingInfo(agentId: string): Promise<PsyStakingInfo>;
  claimRewards(agentId: string): Promise<bigint>;
  
  // Task Coordination
  submitTask(task: Omit<PsyTaskAssignment, 'taskId' | 'status' | 'results'>): Promise<string>;
  acceptTask(taskId: string, agentId: string): Promise<void>;
  submitTaskResult(taskId: string, agentId: string, result: unknown): Promise<void>;
  getTask(taskId: string): Promise<PsyTaskAssignment | null>;
  listTasks(filter?: { status?: string; agentId?: string }): Promise<PsyTaskAssignment[]>;
  
  // Syndicate Operations
  createSyndicate(config: Omit<PsySyndicateConfig, 'syndicateId' | 'createdAt'>): Promise<string>;
  joinSyndicate(syndicateId: string, agentId: string): Promise<void>;
  leaveSyndicate(syndicateId: string, agentId: string): Promise<void>;
  getSyndicate(syndicateId: string): Promise<PsySyndicateConfig | null>;
  
  // Events
  onReputationChange(callback: (update: PsyReputationUpdate) => void): () => void;
  onSlashing(callback: (event: PsySlashingEvent) => void): () => void;
  onTaskAssigned(callback: (task: PsyTaskAssignment) => void): () => void;
}

// ============================================
// Mock Psy Connector (For Development/Testing)
// ============================================

export class MockPsyConnector implements IPsyConnector {
  private connected = false;
  private agents = new Map<string, AgentIdentity>();
  private reputations = new Map<string, ReputationScore>();
  private stakingInfo = new Map<string, PsyStakingInfo>();
  private tasks = new Map<string, PsyTaskAssignment>();
  private syndicates = new Map<string, PsySyndicateConfig>();
  private reputationHistory = new Map<string, PsyReputationUpdate[]>();
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(private config?: Partial<PsyConfig>) {}

  async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log('[MockPsy] Connected to Psy Network (mock)');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[MockPsy] Disconnected from Psy Network');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async registerAgent(registration: PsyAgentRegistration): Promise<string> {
    this.ensureConnected();
    
    const agentId = registration.agentId || `agent_${Date.now()}`;
    
    const identity: AgentIdentity = {
      id: agentId,
      name: registration.metadata.name,
      version: registration.metadata.version,
      owner: registration.owner,
      attestationHash: registration.teeAttestation,
      registeredAt: new Date(),
      lastSeen: new Date(),
    };
    
    this.agents.set(agentId, identity);
    
    // Initialize reputation
    this.reputations.set(agentId, {
      overall: 100,
      reliability: 100,
      accuracy: 100,
      speed: 100,
      costEfficiency: 100,
    });
    
    // Initialize staking info
    this.stakingInfo.set(agentId, {
      agentId,
      totalStaked: registration.stakingAmount,
      lockedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      delegatedFrom: [],
      rewards: 0n,
      slashingHistory: [],
    });
    
    console.log(`[MockPsy] Agent registered: ${agentId}`);
    return agentId;
  }

  async updateAgentCapabilities(agentId: string, capabilities: string[]): Promise<void> {
    this.ensureConnected();
    // In a real implementation, this would update on-chain
    console.log(`[MockPsy] Updated capabilities for ${agentId}: ${capabilities.join(', ')}`);
  }

  async deregisterAgent(agentId: string): Promise<void> {
    this.ensureConnected();
    this.agents.delete(agentId);
    this.reputations.delete(agentId);
    this.stakingInfo.delete(agentId);
    console.log(`[MockPsy] Agent deregistered: ${agentId}`);
  }

  async getAgent(agentId: string): Promise<AgentIdentity | null> {
    this.ensureConnected();
    return this.agents.get(agentId) || null;
  }

  async listAgents(filter?: { capabilities?: string[]; minReputation?: number }): Promise<AgentIdentity[]> {
    this.ensureConnected();
    
    let agents = Array.from(this.agents.values());
    
    if (filter?.minReputation) {
      agents = agents.filter(agent => {
        const rep = this.reputations.get(agent.id);
        return rep && rep.overall >= filter.minReputation!;
      });
    }
    
    return agents;
  }

  async submitReputationUpdate(update: PsyReputationUpdate): Promise<void> {
    this.ensureConnected();
    
    const current = this.reputations.get(update.agentId);
    if (!current) {
      throw new Error(`Agent not found: ${update.agentId}`);
    }
    
    // Update reputation based on outcome
    const modifier = update.outcome === 'success' ? 1 : update.outcome === 'partial' ? 0 : -1;
    const delta = modifier * update.score * 0.1;
    
    this.reputations.set(update.agentId, {
      overall: Math.max(0, Math.min(100, current.overall + delta)),
      reliability: Math.max(0, Math.min(100, current.reliability + delta)),
      accuracy: current.accuracy,
      speed: current.speed,
      costEfficiency: current.costEfficiency,
    });
    
    // Store in history
    const history = this.reputationHistory.get(update.agentId) || [];
    history.push(update);
    this.reputationHistory.set(update.agentId, history);
    
    // Emit event
    this.emit('reputationChange', update);
    
    console.log(`[MockPsy] Reputation updated for ${update.agentId}: ${update.outcome}`);
  }

  async getReputation(agentId: string): Promise<ReputationScore> {
    this.ensureConnected();
    
    const rep = this.reputations.get(agentId);
    if (!rep) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    return rep;
  }

  async getReputationHistory(agentId: string, limit = 100): Promise<PsyReputationUpdate[]> {
    this.ensureConnected();
    const history = this.reputationHistory.get(agentId) || [];
    return history.slice(-limit);
  }

  async stake(agentId: string, amount: bigint): Promise<string> {
    this.ensureConnected();
    
    const info = this.stakingInfo.get(agentId);
    if (!info) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    info.totalStaked += amount;
    this.stakingInfo.set(agentId, info);
    
    const txHash = `0x${Date.now().toString(16)}`;
    console.log(`[MockPsy] Staked ${amount} for ${agentId}. TX: ${txHash}`);
    return txHash;
  }

  async unstake(agentId: string, amount: bigint): Promise<string> {
    this.ensureConnected();
    
    const info = this.stakingInfo.get(agentId);
    if (!info) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    if (info.totalStaked < amount) {
      throw new Error('Insufficient staked balance');
    }
    
    if (Date.now() < info.lockedUntil) {
      throw new Error('Stake is still locked');
    }
    
    info.totalStaked -= amount;
    this.stakingInfo.set(agentId, info);
    
    const txHash = `0x${Date.now().toString(16)}`;
    console.log(`[MockPsy] Unstaked ${amount} for ${agentId}. TX: ${txHash}`);
    return txHash;
  }

  async getStakingInfo(agentId: string): Promise<PsyStakingInfo> {
    this.ensureConnected();
    
    const info = this.stakingInfo.get(agentId);
    if (!info) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    return info;
  }

  async claimRewards(agentId: string): Promise<bigint> {
    this.ensureConnected();
    
    const info = this.stakingInfo.get(agentId);
    if (!info) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    const rewards = info.rewards;
    info.rewards = 0n;
    this.stakingInfo.set(agentId, info);
    
    console.log(`[MockPsy] Claimed ${rewards} rewards for ${agentId}`);
    return rewards;
  }

  async submitTask(task: Omit<PsyTaskAssignment, 'taskId' | 'status' | 'results'>): Promise<string> {
    this.ensureConnected();
    
    const taskId = `task_${Date.now()}`;
    const fullTask: PsyTaskAssignment = {
      ...task,
      taskId,
      status: 'pending',
      results: [],
    };
    
    this.tasks.set(taskId, fullTask);
    console.log(`[MockPsy] Task submitted: ${taskId}`);
    return taskId;
  }

  async acceptTask(taskId: string, agentId: string): Promise<void> {
    this.ensureConnected();
    
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    task.assignedAgents.push(agentId);
    task.status = 'in_progress';
    this.tasks.set(taskId, task);
    
    // Emit event
    this.emit('taskAssigned', task);
    
    console.log(`[MockPsy] Task ${taskId} accepted by ${agentId}`);
  }

  async submitTaskResult(taskId: string, agentId: string, result: unknown): Promise<void> {
    this.ensureConnected();
    
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    task.results = task.results || [];
    task.results.push({
      agentId,
      result,
      timestamp: Date.now(),
    });
    
    // Check if all assigned agents have submitted
    if (task.results.length === task.assignedAgents.length) {
      task.status = 'completed';
    }
    
    this.tasks.set(taskId, task);
    console.log(`[MockPsy] Task ${taskId} result submitted by ${agentId}`);
  }

  async getTask(taskId: string): Promise<PsyTaskAssignment | null> {
    this.ensureConnected();
    return this.tasks.get(taskId) || null;
  }

  async listTasks(filter?: { status?: string; agentId?: string }): Promise<PsyTaskAssignment[]> {
    this.ensureConnected();
    
    let tasks = Array.from(this.tasks.values());
    
    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    
    if (filter?.agentId) {
      tasks = tasks.filter(t => t.assignedAgents.includes(filter.agentId!));
    }
    
    return tasks;
  }

  async createSyndicate(config: Omit<PsySyndicateConfig, 'syndicateId' | 'createdAt'>): Promise<string> {
    this.ensureConnected();
    
    const syndicateId = `syndicate_${Date.now()}`;
    const fullConfig: PsySyndicateConfig = {
      ...config,
      syndicateId,
      createdAt: Date.now(),
    };
    
    this.syndicates.set(syndicateId, fullConfig);
    console.log(`[MockPsy] Syndicate created: ${syndicateId}`);
    return syndicateId;
  }

  async joinSyndicate(syndicateId: string, agentId: string): Promise<void> {
    this.ensureConnected();
    
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) {
      throw new Error(`Syndicate not found: ${syndicateId}`);
    }
    
    if (!syndicate.members.includes(agentId)) {
      syndicate.members.push(agentId);
      this.syndicates.set(syndicateId, syndicate);
    }
    
    console.log(`[MockPsy] Agent ${agentId} joined syndicate ${syndicateId}`);
  }

  async leaveSyndicate(syndicateId: string, agentId: string): Promise<void> {
    this.ensureConnected();
    
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) {
      throw new Error(`Syndicate not found: ${syndicateId}`);
    }
    
    syndicate.members = syndicate.members.filter(m => m !== agentId);
    this.syndicates.set(syndicateId, syndicate);
    
    console.log(`[MockPsy] Agent ${agentId} left syndicate ${syndicateId}`);
  }

  async getSyndicate(syndicateId: string): Promise<PsySyndicateConfig | null> {
    this.ensureConnected();
    return this.syndicates.get(syndicateId) || null;
  }

  onReputationChange(callback: (update: PsyReputationUpdate) => void): () => void {
    return this.on('reputationChange', callback);
  }

  onSlashing(callback: (event: PsySlashingEvent) => void): () => void {
    return this.on('slashing', callback);
  }

  onTaskAssigned(callback: (task: PsyTaskAssignment) => void): () => void {
    return this.on('taskAssigned', callback);
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected to Psy Network');
    }
  }

  private on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// ============================================
// Real Psy Connector (Production)
// ============================================

export class PsyConnector implements IPsyConnector {
  private connected = false;
  private config: PsyConfig;
  private provider?: unknown; // ethers.Provider in production

  constructor(config: PsyConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // TODO: Implement actual Psy Network connection
    // This requires:
    // 1. Psy Network SDK or direct contract interaction
    // 2. Wallet connection for signing transactions
    // 3. WebSocket for event subscriptions
    
    console.log('[PsyConnector] Connecting to:', this.config.networkUrl);
    
    // For now, throw not implemented
    throw new Error('Production Psy connector not yet implemented. Use MockPsyConnector for development.');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // All other methods require connection first
  async registerAgent(_registration: PsyAgentRegistration): Promise<string> {
    throw new Error('Not implemented');
  }

  async updateAgentCapabilities(_agentId: string, _capabilities: string[]): Promise<void> {
    throw new Error('Not implemented');
  }

  async deregisterAgent(_agentId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getAgent(_agentId: string): Promise<AgentIdentity | null> {
    throw new Error('Not implemented');
  }

  async listAgents(_filter?: { capabilities?: string[]; minReputation?: number }): Promise<AgentIdentity[]> {
    throw new Error('Not implemented');
  }

  async submitReputationUpdate(_update: PsyReputationUpdate): Promise<void> {
    throw new Error('Not implemented');
  }

  async getReputation(_agentId: string): Promise<ReputationScore> {
    throw new Error('Not implemented');
  }

  async getReputationHistory(_agentId: string, _limit?: number): Promise<PsyReputationUpdate[]> {
    throw new Error('Not implemented');
  }

  async stake(_agentId: string, _amount: bigint): Promise<string> {
    throw new Error('Not implemented');
  }

  async unstake(_agentId: string, _amount: bigint): Promise<string> {
    throw new Error('Not implemented');
  }

  async getStakingInfo(_agentId: string): Promise<PsyStakingInfo> {
    throw new Error('Not implemented');
  }

  async claimRewards(_agentId: string): Promise<bigint> {
    throw new Error('Not implemented');
  }

  async submitTask(_task: Omit<PsyTaskAssignment, 'taskId' | 'status' | 'results'>): Promise<string> {
    throw new Error('Not implemented');
  }

  async acceptTask(_taskId: string, _agentId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async submitTaskResult(_taskId: string, _agentId: string, _result: unknown): Promise<void> {
    throw new Error('Not implemented');
  }

  async getTask(_taskId: string): Promise<PsyTaskAssignment | null> {
    throw new Error('Not implemented');
  }

  async listTasks(_filter?: { status?: string; agentId?: string }): Promise<PsyTaskAssignment[]> {
    throw new Error('Not implemented');
  }

  async createSyndicate(_config: Omit<PsySyndicateConfig, 'syndicateId' | 'createdAt'>): Promise<string> {
    throw new Error('Not implemented');
  }

  async joinSyndicate(_syndicateId: string, _agentId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async leaveSyndicate(_syndicateId: string, _agentId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getSyndicate(_syndicateId: string): Promise<PsySyndicateConfig | null> {
    throw new Error('Not implemented');
  }

  onReputationChange(_callback: (update: PsyReputationUpdate) => void): () => void {
    return () => {};
  }

  onSlashing(_callback: (event: PsySlashingEvent) => void): () => void {
    return () => {};
  }

  onTaskAssigned(_callback: (task: PsyTaskAssignment) => void): () => void {
    return () => {};
  }
}

// ============================================
// Factory Function
// ============================================

export function createPsyConnector(config?: Partial<PsyConfig>): IPsyConnector {
  const isDevelopment = process.env.NODE_ENV !== 'production' || !config?.networkUrl;
  
  if (isDevelopment) {
    console.log('[Psy] Using MockPsyConnector for development');
    return new MockPsyConnector(config);
  }
  
  return new PsyConnector({
    networkUrl: config?.networkUrl || '',
    contractAddress: config?.contractAddress || '',
    timeout: config?.timeout || 30000,
    retryAttempts: config?.retryAttempts || 3,
    ...config,
  });
}

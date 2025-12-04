/**
 * Velvet Sentinel - Database Interface
 * 
 * Abstract database layer for persistence
 * Supports SQLite (development) and PostgreSQL (production)
 */

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'memory';
  sqlite?: {
    filename: string;
  };
  postgres?: {
    connectionString: string;
    ssl?: boolean;
    poolSize?: number;
  };
}

// Common entity types
export interface AgentRecord {
  id: string;
  name: string;
  type: string;
  address: string;
  publicKey: string;
  status: 'active' | 'inactive' | 'suspended';
  reputation: number;
  tasksCompleted: number;
  earnings: string; // BigInt as string
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface OpportunityRecord {
  id: string;
  agentId: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: string;
  sellPrice: string;
  profitBps: number;
  estimatedProfit: string;
  maxSize: string;
  gasEstimate: string;
  netProfit: string;
  confidence: number;
  status: 'active' | 'expired' | 'executed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  aiAnalysis?: string;
}

export interface ExecutionRecord {
  id: string;
  opportunityId: string;
  agentId: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  buyTxHash?: string;
  sellTxHash?: string;
  actualProfit?: string;
  gasUsed?: string;
  error?: string;
  createdAt: Date;
  executedAt?: Date;
}

export interface SyndicateRecord {
  id: string;
  name: string;
  description: string;
  founderId: string;
  minReputation: number;
  maxMembers: number;
  memberCount: number;
  totalEarnings: string;
  status: 'active' | 'inactive' | 'dissolved';
  createdAt: Date;
  updatedAt: Date;
  config: Record<string, unknown>;
}

export interface MembershipRecord {
  id: string;
  syndicateId: string;
  agentId: string;
  role: 'member' | 'approver' | 'admin' | 'founder';
  votingPower: number;
  contributionScore: number;
  joinedAt: Date;
  leftAt?: Date;
  active: boolean;
}

/**
 * Database interface
 */
export interface IDatabase {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Migrations
  migrate(): Promise<void>;
  
  // Agents
  getAgent(id: string): Promise<AgentRecord | null>;
  getAgents(filter?: Partial<AgentRecord>): Promise<AgentRecord[]>;
  createAgent(agent: Omit<AgentRecord, 'createdAt' | 'updatedAt'>): Promise<AgentRecord>;
  updateAgent(id: string, updates: Partial<AgentRecord>): Promise<AgentRecord | null>;
  
  // Opportunities
  getOpportunity(id: string): Promise<OpportunityRecord | null>;
  getOpportunities(filter?: { agentId?: string; status?: string; minProfit?: number }): Promise<OpportunityRecord[]>;
  createOpportunity(opp: Omit<OpportunityRecord, 'createdAt'>): Promise<OpportunityRecord>;
  updateOpportunity(id: string, updates: Partial<OpportunityRecord>): Promise<OpportunityRecord | null>;
  expireOpportunities(): Promise<number>;
  
  // Executions
  getExecution(id: string): Promise<ExecutionRecord | null>;
  getExecutions(filter?: { agentId?: string; opportunityId?: string; status?: string }): Promise<ExecutionRecord[]>;
  createExecution(exec: Omit<ExecutionRecord, 'createdAt'>): Promise<ExecutionRecord>;
  updateExecution(id: string, updates: Partial<ExecutionRecord>): Promise<ExecutionRecord | null>;
  
  // Syndicates
  getSyndicate(id: string): Promise<SyndicateRecord | null>;
  getSyndicates(filter?: Partial<SyndicateRecord>): Promise<SyndicateRecord[]>;
  createSyndicate(syndicate: Omit<SyndicateRecord, 'createdAt' | 'updatedAt'>): Promise<SyndicateRecord>;
  updateSyndicate(id: string, updates: Partial<SyndicateRecord>): Promise<SyndicateRecord | null>;
  
  // Memberships
  getMembership(syndicateId: string, agentId: string): Promise<MembershipRecord | null>;
  getMemberships(syndicateId: string): Promise<MembershipRecord[]>;
  createMembership(membership: Omit<MembershipRecord, 'id'>): Promise<MembershipRecord>;
  updateMembership(id: string, updates: Partial<MembershipRecord>): Promise<MembershipRecord | null>;
  
  // Stats
  getStats(): Promise<{
    totalAgents: number;
    activeOpportunities: number;
    totalExecutions: number;
    successfulExecutions: number;
    totalProfit: string;
  }>;
}

/**
 * In-memory database for development/testing
 */
export class MemoryDatabase implements IDatabase {
  private connected = false;
  private agents: Map<string, AgentRecord> = new Map();
  private opportunities: Map<string, OpportunityRecord> = new Map();
  private executions: Map<string, ExecutionRecord> = new Map();
  private syndicates: Map<string, SyndicateRecord> = new Map();
  private memberships: Map<string, MembershipRecord> = new Map();

  async connect(): Promise<void> {
    this.connected = true;
    console.log('[MemoryDatabase] Connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[MemoryDatabase] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async migrate(): Promise<void> {
    console.log('[MemoryDatabase] No migrations needed');
  }

  // Agents
  async getAgent(id: string): Promise<AgentRecord | null> {
    return this.agents.get(id) || null;
  }

  async getAgents(filter?: Partial<AgentRecord>): Promise<AgentRecord[]> {
    let results = Array.from(this.agents.values());
    if (filter) {
      results = results.filter(a => {
        for (const [key, value] of Object.entries(filter)) {
          if (a[key as keyof AgentRecord] !== value) return false;
        }
        return true;
      });
    }
    return results;
  }

  async createAgent(agent: Omit<AgentRecord, 'createdAt' | 'updatedAt'>): Promise<AgentRecord> {
    const now = new Date();
    const record: AgentRecord = { ...agent, createdAt: now, updatedAt: now };
    this.agents.set(agent.id, record);
    return record;
  }

  async updateAgent(id: string, updates: Partial<AgentRecord>): Promise<AgentRecord | null> {
    const agent = this.agents.get(id);
    if (!agent) return null;
    const updated = { ...agent, ...updates, updatedAt: new Date() };
    this.agents.set(id, updated);
    return updated;
  }

  // Opportunities
  async getOpportunity(id: string): Promise<OpportunityRecord | null> {
    return this.opportunities.get(id) || null;
  }

  async getOpportunities(filter?: { agentId?: string; status?: string; minProfit?: number }): Promise<OpportunityRecord[]> {
    let results = Array.from(this.opportunities.values());
    if (filter) {
      if (filter.agentId) results = results.filter(o => o.agentId === filter.agentId);
      if (filter.status) results = results.filter(o => o.status === filter.status);
      if (filter.minProfit) results = results.filter(o => o.profitBps >= filter.minProfit);
    }
    return results;
  }

  async createOpportunity(opp: Omit<OpportunityRecord, 'createdAt'>): Promise<OpportunityRecord> {
    const record: OpportunityRecord = { ...opp, createdAt: new Date() };
    this.opportunities.set(opp.id, record);
    return record;
  }

  async updateOpportunity(id: string, updates: Partial<OpportunityRecord>): Promise<OpportunityRecord | null> {
    const opp = this.opportunities.get(id);
    if (!opp) return null;
    const updated = { ...opp, ...updates };
    this.opportunities.set(id, updated);
    return updated;
  }

  async expireOpportunities(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, opp] of this.opportunities) {
      if (opp.status === 'active' && opp.expiresAt < now) {
        this.opportunities.set(id, { ...opp, status: 'expired' });
        count++;
      }
    }
    return count;
  }

  // Executions
  async getExecution(id: string): Promise<ExecutionRecord | null> {
    return this.executions.get(id) || null;
  }

  async getExecutions(filter?: { agentId?: string; opportunityId?: string; status?: string }): Promise<ExecutionRecord[]> {
    let results = Array.from(this.executions.values());
    if (filter) {
      if (filter.agentId) results = results.filter(e => e.agentId === filter.agentId);
      if (filter.opportunityId) results = results.filter(e => e.opportunityId === filter.opportunityId);
      if (filter.status) results = results.filter(e => e.status === filter.status);
    }
    return results;
  }

  async createExecution(exec: Omit<ExecutionRecord, 'createdAt'>): Promise<ExecutionRecord> {
    const record: ExecutionRecord = { ...exec, createdAt: new Date() };
    this.executions.set(exec.id, record);
    return record;
  }

  async updateExecution(id: string, updates: Partial<ExecutionRecord>): Promise<ExecutionRecord | null> {
    const exec = this.executions.get(id);
    if (!exec) return null;
    const updated = { ...exec, ...updates };
    this.executions.set(id, updated);
    return updated;
  }

  // Syndicates
  async getSyndicate(id: string): Promise<SyndicateRecord | null> {
    return this.syndicates.get(id) || null;
  }

  async getSyndicates(filter?: Partial<SyndicateRecord>): Promise<SyndicateRecord[]> {
    let results = Array.from(this.syndicates.values());
    if (filter) {
      results = results.filter(s => {
        for (const [key, value] of Object.entries(filter)) {
          if (s[key as keyof SyndicateRecord] !== value) return false;
        }
        return true;
      });
    }
    return results;
  }

  async createSyndicate(syndicate: Omit<SyndicateRecord, 'createdAt' | 'updatedAt'>): Promise<SyndicateRecord> {
    const now = new Date();
    const record: SyndicateRecord = { ...syndicate, createdAt: now, updatedAt: now };
    this.syndicates.set(syndicate.id, record);
    return record;
  }

  async updateSyndicate(id: string, updates: Partial<SyndicateRecord>): Promise<SyndicateRecord | null> {
    const syndicate = this.syndicates.get(id);
    if (!syndicate) return null;
    const updated = { ...syndicate, ...updates, updatedAt: new Date() };
    this.syndicates.set(id, updated);
    return updated;
  }

  // Memberships
  async getMembership(syndicateId: string, agentId: string): Promise<MembershipRecord | null> {
    for (const m of this.memberships.values()) {
      if (m.syndicateId === syndicateId && m.agentId === agentId) return m;
    }
    return null;
  }

  async getMemberships(syndicateId: string): Promise<MembershipRecord[]> {
    return Array.from(this.memberships.values()).filter(m => m.syndicateId === syndicateId);
  }

  async createMembership(membership: Omit<MembershipRecord, 'id'>): Promise<MembershipRecord> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const record: MembershipRecord = { id, ...membership };
    this.memberships.set(id, record);
    return record;
  }

  async updateMembership(id: string, updates: Partial<MembershipRecord>): Promise<MembershipRecord | null> {
    const membership = this.memberships.get(id);
    if (!membership) return null;
    const updated = { ...membership, ...updates };
    this.memberships.set(id, updated);
    return updated;
  }

  // Stats
  async getStats(): Promise<{
    totalAgents: number;
    activeOpportunities: number;
    totalExecutions: number;
    successfulExecutions: number;
    totalProfit: string;
  }> {
    const executions = Array.from(this.executions.values());
    const successful = executions.filter(e => e.status === 'success');
    const totalProfit = successful.reduce((sum, e) => {
      return sum + BigInt(e.actualProfit || '0');
    }, 0n);

    return {
      totalAgents: this.agents.size,
      activeOpportunities: Array.from(this.opportunities.values()).filter(o => o.status === 'active').length,
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      totalProfit: totalProfit.toString(),
    };
  }
}

/**
 * Create database instance based on config
 */
export function createDatabase(config: DatabaseConfig): IDatabase {
  // For now, return memory database
  // In production, implement SQLite/PostgreSQL
  return new MemoryDatabase();
}

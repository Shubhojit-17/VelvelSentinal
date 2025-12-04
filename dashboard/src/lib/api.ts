import { AGENT_ENDPOINTS } from './config';

export interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'ready' | 'busy' | 'error' | 'offline';
  address?: string;
  tasksCompleted: number;
  earnings: string;
}

export interface SecurityReport {
  id: string;
  target: string;
  riskScore: number;
  findingsCount: number;
  criticalCount: number;
  summary: string;
  timestamp: string;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedAddress?: string;
  transactionHash?: string;
  recommendedAction: string;
  timestamp: string;
}

export interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  profitBps: number;
  netProfit: string;
  confidence: number;
  expiresAt: string;
}

export interface Proposal {
  id: string;
  daoName: string;
  title: string;
  status: string;
  forVotes: string;
  againstVotes: string;
  recommendation?: string;
}

// Fetch agent status
async function fetchAgentStatus(endpoint: string, name: string): Promise<AgentStatus> {
  try {
    const [identityRes, stateRes] = await Promise.all([
      fetch(`${endpoint}/identity`),
      fetch(`${endpoint}/state`),
    ]);

    if (!identityRes.ok || !stateRes.ok) {
      throw new Error('Agent offline');
    }

    const identity = await identityRes.json();
    const state = await stateRes.json();

    return {
      id: identity.id,
      name: identity.name || name,
      type: identity.type,
      status: state.status,
      address: identity.address,
      tasksCompleted: state.tasksCompleted,
      earnings: state.earnings,
    };
  } catch {
    return {
      id: name.toLowerCase(),
      name,
      type: 'unknown',
      status: 'offline',
      tasksCompleted: 0,
      earnings: '0',
    };
  }
}

// Get all agent statuses
export async function getAllAgentStatuses(): Promise<AgentStatus[]> {
  const statuses = await Promise.all([
    fetchAgentStatus(AGENT_ENDPOINTS.sentinel, 'Sentinel Agent'),
    fetchAgentStatus(AGENT_ENDPOINTS.arbitrage, 'Arbitrage Agent'),
    fetchAgentStatus(AGENT_ENDPOINTS.governance, 'Governance Agent'),
  ]);

  return statuses;
}

// Fetch security reports
export async function getSecurityReports(limit: number = 5): Promise<SecurityReport[]> {
  // In production, would fetch from agent
  return [];
}

// Fetch security alerts from sentinel agent
export async function getSecurityAlerts(limit: number = 10): Promise<SecurityAlert[]> {
  try {
    const res = await fetch(`${AGENT_ENDPOINTS.sentinel}/alerts?limit=${limit}`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.map((a: any) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      description: a.description,
      affectedAddress: a.affectedAddress,
      transactionHash: a.transactionHash,
      recommendedAction: a.recommendedAction,
      timestamp: a.timestamp,
    }));
  } catch {
    return [];
  }
}

// Fetch arbitrage opportunities
export async function getArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  try {
    const res = await fetch(`${AGENT_ENDPOINTS.arbitrage}/opportunities`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.opportunities.map((o: any) => ({
      id: o.id,
      pair: `${o.pair.symbolA}/${o.pair.symbolB}`,
      buyDex: o.buyDex,
      sellDex: o.sellDex,
      profitBps: o.profitBps,
      netProfit: o.netProfit,
      confidence: o.confidence,
      expiresAt: o.expiresAt,
    }));
  } catch {
    return [];
  }
}

// Fetch governance proposals
export async function getGovernanceProposals(): Promise<Proposal[]> {
  try {
    const res = await fetch(`${AGENT_ENDPOINTS.governance}/proposals`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.proposals.map((p: any) => ({
      id: p.id,
      daoName: p.daoId,
      title: p.title,
      status: p.status,
      forVotes: p.forVotes,
      againstVotes: p.againstVotes,
    }));
  } catch {
    return [];
  }
}

// Request security scan
export async function requestSecurityScan(target: string, type: string): Promise<any> {
  const res = await fetch(`${AGENT_ENDPOINTS.sentinel}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, type, depth: 'standard' }),
  });

  if (!res.ok) {
    if (res.status === 402) {
      const challenge = await res.json();
      throw new Error(`Payment required: ${challenge.accepts[0].maxAmountRequired}`);
    }
    throw new Error('Scan failed');
  }

  return res.json();
}

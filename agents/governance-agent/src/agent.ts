/**
 * Velvet Sentinel - DAO Governance Agent
 *
 * Analyzes governance proposals, provides voting recommendations,
 * and can execute delegated voting on behalf of token holders
 */

import type { Context } from 'hono';
import { BaseAgent, type AgentConfig } from '@velvet/agent-core';
import type { Address, Hex } from 'viem';

// Governance types
export interface GovernanceDAO {
  id: string;
  name: string;
  governanceContract: Address;
  tokenContract: Address;
  votingPeriod: number; // in blocks
  quorumThreshold: bigint;
  proposalThreshold: bigint;
}

export interface Proposal {
  id: string;
  daoId: string;
  proposer: Address;
  title: string;
  description: string;
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
  startBlock: bigint;
  endBlock: bigint;
  status: 'pending' | 'active' | 'passed' | 'rejected' | 'executed' | 'expired';
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  createdAt: Date;
}

export interface ProposalAnalysis {
  id: string;
  proposalId: string;
  recommendation: 'for' | 'against' | 'abstain';
  confidence: number; // 0-100
  summary: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
  impactAnalysis: {
    treasury: string;
    tokenomics: string;
    governance: string;
    security: string;
  };
  evidenceId: string;
  analyzedAt: Date;
}

export interface VoteDelegation {
  id: string;
  delegator: Address;
  daoId: string;
  votingPower: bigint;
  strategy: 'follow-analysis' | 'always-for' | 'always-against' | 'manual';
  active: boolean;
  expiresAt?: Date;
}

export interface VoteRecord {
  id: string;
  proposalId: string;
  daoId: string;
  voter: Address;
  support: 'for' | 'against' | 'abstain';
  weight: bigint;
  reason?: string;
  transactionHash?: Hex;
  votedAt: Date;
}

/**
 * GovernanceAgent - DAO governance analysis and voting
 */
export class GovernanceAgent extends BaseAgent {
  private daos: Map<string, GovernanceDAO> = new Map();
  private proposals: Map<string, Proposal> = new Map();
  private analyses: Map<string, ProposalAnalysis> = new Map();
  private delegations: Map<string, VoteDelegation> = new Map();
  private voteRecords: VoteRecord[] = [];
  private syncInterval?: ReturnType<typeof setInterval>;

  constructor(config: Omit<AgentConfig, 'type' | 'capabilities'>) {
    super({
      ...config,
      type: 'governance',
      capabilities: ['governance-analysis', 'voting', 'proposal-creation'] as string[],
    });
  }

  protected async onInitialize(): Promise<void> {
    console.log('Governance Agent: Loading governance analysis models...');
  }

  protected async setupRoutes(): Promise<void> {
    // DAO management
    this.app.get('/daos', this.handleListDAOs.bind(this));
    this.app.post('/daos/register', this.handleRegisterDAO.bind(this));

    // Proposals
    this.app.get('/proposals', this.handleListProposals.bind(this));
    this.app.get('/proposal/:id', this.handleGetProposal.bind(this));

    // Analysis (paid)
    this.paidRoute(
      'post',
      '/analyze',
      { type: 'fixed', amount: 200000n }, // 0.20 USDC
      this.handleAnalyzeProposal.bind(this)
    );

    // Get analysis
    this.app.get('/analysis/:proposalId', this.handleGetAnalysis.bind(this));

    // Delegation management
    this.paidRoute(
      'post',
      '/delegate',
      { type: 'fixed', amount: 100000n }, // 0.10 USDC
      this.handleDelegate.bind(this)
    );
    this.app.get('/delegations', this.handleListDelegations.bind(this));
    this.app.post('/delegate/revoke', this.handleRevokeDelegation.bind(this));

    // Voting (paid)
    this.paidRoute(
      'post',
      '/vote',
      { type: 'fixed', amount: 50000n }, // 0.05 USDC
      this.handleVote.bind(this)
    );

    // Vote history
    this.app.get('/votes', this.handleGetVotes.bind(this));

    // Sync proposals from chain
    this.app.post('/sync', this.handleSync.bind(this));
  }

  /**
   * List registered DAOs
   */
  private handleListDAOs(ctx: Context): Response {
    const daos = Array.from(this.daos.values()).map((dao) => ({
      ...dao,
      quorumThreshold: dao.quorumThreshold.toString(),
      proposalThreshold: dao.proposalThreshold.toString(),
    }));

    return ctx.json({ count: daos.length, daos });
  }

  /**
   * Register a DAO for monitoring
   */
  private async handleRegisterDAO(ctx: Context): Promise<Response> {
    try {
      const dao = await ctx.req.json<Omit<GovernanceDAO, 'id'>>();

      const daoId = `dao_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const registeredDAO: GovernanceDAO = {
        ...dao,
        id: daoId,
        quorumThreshold: BigInt(dao.quorumThreshold),
        proposalThreshold: BigInt(dao.proposalThreshold),
      };

      this.daos.set(daoId, registeredDAO);

      return ctx.json({
        id: daoId,
        name: registeredDAO.name,
        status: 'registered',
      });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Registration failed' },
        500
      );
    }
  }

  /**
   * List proposals
   */
  private handleListProposals(ctx: Context): Response {
    const daoId = ctx.req.query('daoId');
    const status = ctx.req.query('status');

    let proposals = Array.from(this.proposals.values());

    if (daoId) {
      proposals = proposals.filter((p) => p.daoId === daoId);
    }
    if (status) {
      proposals = proposals.filter((p) => p.status === status);
    }

    // Sort by creation date (newest first)
    proposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return ctx.json({
      count: proposals.length,
      proposals: proposals.map((p) => ({
        ...p,
        values: p.values.map((v) => v.toString()),
        startBlock: p.startBlock.toString(),
        endBlock: p.endBlock.toString(),
        forVotes: p.forVotes.toString(),
        againstVotes: p.againstVotes.toString(),
        abstainVotes: p.abstainVotes.toString(),
      })),
    });
  }

  /**
   * Get proposal details
   */
  private handleGetProposal(ctx: Context): Response {
    const id = ctx.req.param('id');
    const proposal = this.proposals.get(id);

    if (!proposal) {
      return ctx.json({ error: 'Proposal not found' }, 404);
    }

    const analysis = this.analyses.get(id);

    return ctx.json({
      proposal: {
        ...proposal,
        values: proposal.values.map((v) => v.toString()),
        startBlock: proposal.startBlock.toString(),
        endBlock: proposal.endBlock.toString(),
        forVotes: proposal.forVotes.toString(),
        againstVotes: proposal.againstVotes.toString(),
        abstainVotes: proposal.abstainVotes.toString(),
      },
      analysis: analysis || null,
    });
  }

  /**
   * Analyze a proposal with AI
   */
  private async handleAnalyzeProposal(ctx: Context): Promise<Response> {
    try {
      const { proposalId } = await ctx.req.json<{ proposalId: string }>();
      const proposal = this.proposals.get(proposalId);

      if (!proposal) {
        return ctx.json({ error: 'Proposal not found' }, 404);
      }

      const analysis = await this.analyzeProposal(proposal);
      this.analyses.set(proposalId, analysis);

      this.recordTask(200000n);

      return ctx.json(analysis);
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Analysis failed' },
        500
      );
    }
  }

  /**
   * Get existing analysis
   */
  private handleGetAnalysis(ctx: Context): Response {
    const proposalId = ctx.req.param('proposalId');
    const analysis = this.analyses.get(proposalId);

    if (!analysis) {
      return ctx.json({ error: 'Analysis not found' }, 404);
    }

    return ctx.json(analysis);
  }

  /**
   * Delegate voting power
   */
  private async handleDelegate(ctx: Context): Promise<Response> {
    try {
      const { daoId, votingPower, strategy, expiresAt } = await ctx.req.json<{
        daoId: string;
        votingPower: string;
        strategy: VoteDelegation['strategy'];
        expiresAt?: string;
      }>();

      // In production, would verify the delegator's signature
      const delegator = '0x0000000000000000000000000000000000000000' as Address;

      const delegationId = `del_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const delegation: VoteDelegation = {
        id: delegationId,
        delegator,
        daoId,
        votingPower: BigInt(votingPower),
        strategy,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      };

      this.delegations.set(delegationId, delegation);

      this.recordTask(100000n);

      return ctx.json({
        delegationId,
        daoId,
        strategy,
        status: 'active',
      });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Delegation failed' },
        500
      );
    }
  }

  /**
   * List delegations
   */
  private handleListDelegations(ctx: Context): Response {
    const daoId = ctx.req.query('daoId');

    let delegations = Array.from(this.delegations.values()).filter((d) => d.active);

    if (daoId) {
      delegations = delegations.filter((d) => d.daoId === daoId);
    }

    return ctx.json({
      count: delegations.length,
      delegations: delegations.map((d) => ({
        ...d,
        votingPower: d.votingPower.toString(),
      })),
    });
  }

  /**
   * Revoke delegation
   */
  private async handleRevokeDelegation(ctx: Context): Promise<Response> {
    const { delegationId } = await ctx.req.json<{ delegationId: string }>();

    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      return ctx.json({ error: 'Delegation not found' }, 404);
    }

    delegation.active = false;
    this.delegations.set(delegationId, delegation);

    return ctx.json({ delegationId, status: 'revoked' });
  }

  /**
   * Cast vote on proposal
   */
  private async handleVote(ctx: Context): Promise<Response> {
    try {
      const { proposalId, support, reason } = await ctx.req.json<{
        proposalId: string;
        support: 'for' | 'against' | 'abstain';
        reason?: string;
      }>();

      const proposal = this.proposals.get(proposalId);
      if (!proposal) {
        return ctx.json({ error: 'Proposal not found' }, 404);
      }

      if (proposal.status !== 'active') {
        return ctx.json({ error: 'Proposal is not active' }, 400);
      }

      // Execute vote with TEE-signed transaction
      const vote = await this.executeVote(proposal, support, reason);

      this.recordTask(50000n);

      return ctx.json({
        voteId: vote.id,
        proposalId,
        support,
        weight: vote.weight.toString(),
        transactionHash: vote.transactionHash,
      });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Vote failed' },
        500
      );
    }
  }

  /**
   * Get vote history
   */
  private handleGetVotes(ctx: Context): Response {
    const proposalId = ctx.req.query('proposalId');
    const daoId = ctx.req.query('daoId');

    let votes = [...this.voteRecords];

    if (proposalId) {
      votes = votes.filter((v) => v.proposalId === proposalId);
    }
    if (daoId) {
      votes = votes.filter((v) => v.daoId === daoId);
    }

    // Sort by date (newest first)
    votes.sort((a, b) => b.votedAt.getTime() - a.votedAt.getTime());

    return ctx.json({
      count: votes.length,
      votes: votes.map((v) => ({
        ...v,
        weight: v.weight.toString(),
      })),
    });
  }

  /**
   * Sync proposals from chain
   */
  private async handleSync(ctx: Context): Promise<Response> {
    const { daoId } = await ctx.req.json<{ daoId: string }>();

    const dao = this.daos.get(daoId);
    if (!dao) {
      return ctx.json({ error: 'DAO not found' }, 404);
    }

    // In production, would fetch proposals from blockchain
    // Simulate adding a demo proposal
    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const proposal: Proposal = {
      id: proposalId,
      daoId,
      proposer: '0x0000000000000000000000000000000000000001' as Address,
      title: 'Treasury Allocation for Development',
      description: 'Allocate 100,000 tokens from treasury for Q1 development initiatives.',
      targets: [dao.tokenContract],
      values: [0n],
      calldatas: ['0x' as Hex],
      startBlock: BigInt(Math.floor(Date.now() / 1000)),
      endBlock: BigInt(Math.floor(Date.now() / 1000) + 604800), // 1 week
      status: 'active',
      forVotes: 0n,
      againstVotes: 0n,
      abstainVotes: 0n,
      createdAt: new Date(),
    };

    this.proposals.set(proposalId, proposal);

    return ctx.json({
      synced: 1,
      proposals: [proposalId],
    });
  }

  /**
   * Analyze proposal with AI
   */
  private async analyzeProposal(proposal: Proposal): Promise<ProposalAnalysis> {
    this.updateState({ status: 'busy' });

    try {
      const dao = this.daos.get(proposal.daoId);

      const prompt = `Analyze this DAO governance proposal:

DAO: ${dao?.name || 'Unknown'}
Title: ${proposal.title}
Description: ${proposal.description}
Proposer: ${proposal.proposer}
Targets: ${proposal.targets.join(', ')}
Values: ${proposal.values.map((v) => v.toString()).join(', ')}

Current Votes:
- For: ${proposal.forVotes.toString()}
- Against: ${proposal.againstVotes.toString()}
- Abstain: ${proposal.abstainVotes.toString()}

Provide a comprehensive analysis including:
1. Summary of what the proposal does
2. Risk assessment (security, economic, governance)
3. Impact analysis on treasury, tokenomics, governance power
4. Voting recommendation (FOR/AGAINST/ABSTAIN) with reasoning
5. Confidence score (0-100)

Format your response clearly with sections.`;

      const aiResponse = await this.requestAI(prompt, {
        model: 'llama-3.1-70b',
        maxTokens: 2048,
        temperature: 0.4,
      });

      // Parse AI response
      const analysis = this.parseAnalysis(proposal.id, aiResponse.content, aiResponse.evidenceId);

      this.updateState({ status: 'ready' });
      return analysis;
    } catch (error) {
      this.updateState({ status: 'ready' });
      throw error;
    }
  }

  /**
   * Parse AI analysis response
   */
  private parseAnalysis(
    proposalId: string,
    content: string,
    evidenceId: string
  ): ProposalAnalysis {
    // Extract recommendation
    let recommendation: 'for' | 'against' | 'abstain' = 'abstain';
    if (/recommend.*for|vote.*for|support/i.test(content)) {
      recommendation = 'for';
    } else if (/recommend.*against|vote.*against|oppose/i.test(content)) {
      recommendation = 'against';
    }

    // Extract confidence
    const confidenceMatch = content.match(/confidence[:\s]+(\d+)/i);
    const confidence = confidenceMatch ? Number(confidenceMatch[1]) : 50;

    // Extract risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (/critical risk|very high risk/i.test(content)) {
      riskLevel = 'critical';
    } else if (/high risk/i.test(content)) {
      riskLevel = 'high';
    } else if (/low risk|minimal risk/i.test(content)) {
      riskLevel = 'low';
    }

    return {
      id: `analysis_${Date.now()}`,
      proposalId,
      recommendation,
      confidence,
      summary: content.split('\n').slice(0, 3).join(' ').slice(0, 500),
      riskAssessment: {
        level: riskLevel,
        factors: ['Security review needed', 'Economic impact assessment'],
      },
      impactAnalysis: {
        treasury: 'Moderate impact expected',
        tokenomics: 'Minimal dilution effect',
        governance: 'No change to voting power distribution',
        security: 'Standard risk profile',
      },
      evidenceId,
      analyzedAt: new Date(),
    };
  }

  /**
   * Execute vote with TEE
   */
  private async executeVote(
    proposal: Proposal,
    support: 'for' | 'against' | 'abstain',
    reason?: string
  ): Promise<VoteRecord> {
    // Calculate total delegated voting power for this DAO
    let totalPower = 0n;
    for (const delegation of this.delegations.values()) {
      if (delegation.daoId === proposal.daoId && delegation.active) {
        totalPower += delegation.votingPower;
      }
    }

    // If no delegations, use default power
    if (totalPower === 0n) {
      totalPower = 1000000000000000000n; // 1 token for demo
    }

    // Sign vote transaction with TEE
    const voteData = JSON.stringify({
      proposalId: proposal.id,
      support,
      weight: totalPower.toString(),
      reason,
      timestamp: Date.now(),
    });

    const signature = await this.sign(voteData);

    // Create vote record
    const registeredAgent = this.getRegisteredAgent();
    const voterAddress = (registeredAgent?.identity?.publicKey?.slice(0, 42) ?? '0x0') as Address;
    
    const voteRecord: VoteRecord = {
      id: `vote_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      proposalId: proposal.id,
      daoId: proposal.daoId,
      voter: voterAddress,
      support,
      weight: totalPower,
      reason,
      transactionHash: signature,
      votedAt: new Date(),
    };

    this.voteRecords.push(voteRecord);

    // Update proposal vote counts
    const supportKey = support === 'for' ? 'forVotes' : support === 'against' ? 'againstVotes' : 'abstainVotes';
    proposal[supportKey] += totalPower;
    this.proposals.set(proposal.id, proposal);

    return voteRecord;
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    await super.shutdown();
  }
}

export default GovernanceAgent;

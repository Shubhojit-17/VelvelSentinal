/**
 * Velvet Sentinel - Syndicate Manager
 *
 * Manages agent syndicates (groups of cooperating agents)
 */

import type { Address, Hex } from 'viem';
import type {
  SyndicateConfig,
  SyndicateMember,
  SyndicateTask,
  TaskAssignment,
  ReputationScore,
} from '@velvet/shared-types';

export interface SyndicateState {
  id: string;
  config: SyndicateConfig;
  members: Map<string, SyndicateMember>;
  activeTasks: Map<string, SyndicateTask>;
  completedTasks: number;
  totalEarnings: bigint;
}

/**
 * SyndicateManager - Coordinates agent cooperation
 */
export class SyndicateManager {
  private syndicates: Map<string, SyndicateState> = new Map();

  /**
   * Create a new syndicate
   */
  createSyndicate(config: SyndicateConfig): string {
    const syndicateId = config.id || `syn_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const state: SyndicateState = {
      id: syndicateId,
      config: { ...config, id: syndicateId },
      members: new Map(),
      activeTasks: new Map(),
      completedTasks: 0,
      totalEarnings: 0n,
    };

    this.syndicates.set(syndicateId, state);
    return syndicateId;
  }

  /**
   * Add a member to a syndicate
   */
  addMember(syndicateId: string, member: SyndicateMember): boolean {
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) return false;

    if (syndicate.members.size >= syndicate.config.maxMembers) {
      return false;
    }

    syndicate.members.set(member.agent_id, member);
    return true;
  }

  /**
   * Remove a member from a syndicate
   */
  removeMember(syndicateId: string, agentId: string): boolean {
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) return false;

    return syndicate.members.delete(agentId);
  }

  /**
   * Get syndicate members
   */
  getMembers(syndicateId: string): SyndicateMember[] {
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) return [];

    return Array.from(syndicate.members.values());
  }

  /**
   * Create a task for the syndicate
   */
  createTask(syndicateId: string, task: Omit<SyndicateTask, 'id' | 'syndicateId' | 'createdAt'>): SyndicateTask | null {
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) return null;

    const syndicateTask: SyndicateTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      syndicateId,
      ...task,
      createdAt: new Date(),
    };

    syndicate.activeTasks.set(syndicateTask.id, syndicateTask);
    return syndicateTask;
  }

  /**
   * Assign task to member based on capabilities and reputation
   */
  assignTask(syndicateId: string, taskId: string): TaskAssignment | null {
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) return null;

    const task = syndicate.activeTasks.get(taskId);
    if (!task) return null;

    // Find best member for task based on capabilities
    const eligibleMembers = Array.from(syndicate.members.values()).filter(
      (member) =>
        member.status === 'active' &&
        task.requiredCapabilities.every((cap: string) =>
          member.capabilities?.includes(cap)
        )
    );

    if (eligibleMembers.length === 0) return null;

    // Sort by reputation and select best
    eligibleMembers.sort((a, b) => {
      const scoreA = this.calculateMemberScore(a.reputation);
      const scoreB = this.calculateMemberScore(b.reputation);
      return scoreB - scoreA;
    });

    const assignedMember = eligibleMembers[0];

    const assignment: TaskAssignment = {
      taskId,
      agentId: assignedMember.agent_id,
      assignedAt: new Date(),
      status: 'assigned',
    };

    // Update task status
    task.status = 'in-progress';
    task.assignments = task.assignments || [];
    task.assignments.push(assignment);

    return assignment;
  }

  /**
   * Complete a task assignment
   */
  completeTask(
    syndicateId: string,
    taskId: string,
    result: {
      success: boolean;
      output?: unknown;
      earnings?: bigint;
    }
  ): boolean {
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) return false;

    const task = syndicate.activeTasks.get(taskId);
    if (!task) return false;

    task.status = result.success ? 'completed' : 'failed';
    task.completedAt = new Date();
    task.result = result.output;

    if (result.earnings) {
      syndicate.totalEarnings += result.earnings;
    }

    syndicate.completedTasks++;
    syndicate.activeTasks.delete(taskId);

    return true;
  }

  /**
   * Distribute earnings among members
   */
  distributeEarnings(
    syndicateId: string,
    totalAmount: bigint
  ): Map<string, bigint> | null {
    const syndicate = this.syndicates.get(syndicateId);
    if (!syndicate) return null;

    const distribution = new Map<string, bigint>();
    const members = Array.from(syndicate.members.values());

    if (members.length === 0) return distribution;

    // Calculate total shares based on reputation and contribution
    let totalShares = 0n;
    const memberShares = new Map<string, bigint>();

    for (const member of members) {
      const score = BigInt(Math.floor(this.calculateMemberScore(member.reputation) * 100));
      const share = score + 100n; // Base share + reputation bonus
      memberShares.set(member.agent_id, share);
      totalShares += share;
    }

    // Distribute proportionally
    for (const [agentId, share] of memberShares) {
      const amount = (totalAmount * share) / totalShares;
      distribution.set(agentId, amount);
    }

    return distribution;
  }

  /**
   * Calculate member score from reputation
   */
  private calculateMemberScore(reputation: number | ReputationScore): number {
    if (typeof reputation === 'number') {
      return reputation;
    }
    return (
      reputation.overall * 0.3 +
      reputation.reliability * 0.25 +
      reputation.accuracy * 0.25 +
      reputation.speed * 0.1 +
      reputation.costEfficiency * 0.1
    );
  }

  /**
   * Get syndicate state
   */
  getSyndicate(syndicateId: string): SyndicateState | undefined {
    return this.syndicates.get(syndicateId);
  }

  /**
   * List all syndicates
   */
  listSyndicates(): SyndicateConfig[] {
    return Array.from(this.syndicates.values()).map((s) => s.config);
  }
}

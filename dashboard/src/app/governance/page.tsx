'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { HeaderBar } from '@/components/HeaderBar';
import {
  Vote,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  BarChart3,
  Coins,
  Shield,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGovernanceProposals, type Proposal } from '@/lib/api';

interface GovernanceStats {
  activeProposals: number;
  daosTracked: number;
  votesCast: number;
  successRate: number;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Active' },
  passed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Passed' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Rejected' },
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
  executed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Executed' },
};

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<GovernanceStats>({
    activeProposals: 0,
    daosTracked: 0,
    votesCast: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [votingOn, setVotingOn] = useState<string | null>(null);
  const [votedProposals, setVotedProposals] = useState<Record<string, 'for' | 'against'>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const proposalsData = await getGovernanceProposals();
        setProposals(proposalsData);

        // Calculate stats
        const activeCount = proposalsData.filter(p => p.status === 'active').length;
        const uniqueDAOs = new Set(proposalsData.map(p => p.daoName)).size;
        setStats({
          activeProposals: activeCount,
          daosTracked: uniqueDAOs,
          votesCast: proposalsData.length,
          successRate: proposalsData.length > 0 
            ? (proposalsData.filter(p => p.status === 'passed' || p.status === 'executed').length / proposalsData.length) * 100
            : 0,
        });
      } catch (error) {
        console.error('Failed to fetch governance data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const calculateVotePercentages = (forVotes: string, againstVotes: string) => {
    const forNum = parseFloat(forVotes) || 0;
    const againstNum = parseFloat(againstVotes) || 0;
    const total = forNum + againstNum;
    if (total === 0) return { for: 0, against: 0 };
    return {
      for: (forNum / total) * 100,
      against: (againstNum / total) * 100,
    };
  };

  const handleVote = async (proposalId: string, voteType: 'for' | 'against') => {
    if (votedProposals[proposalId]) return; // Already voted
    
    setVotingOn(`${proposalId}-${voteType}`);
    try {
      // Simulate voting - in production this would call the governance agent
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mark as voted
      setVotedProposals(prev => ({ ...prev, [proposalId]: voteType }));
      
      // Update proposal votes (simulate vote being counted)
      setProposals(prev => prev.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            forVotes: voteType === 'for' ? String(parseFloat(p.forVotes) + 1) : p.forVotes,
            againstVotes: voteType === 'against' ? String(parseFloat(p.againstVotes) + 1) : p.againstVotes,
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVotingOn(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-72 flex-1 p-8">
        <HeaderBar />

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
              <Vote className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Governance Hub</h1>
              <p className="text-gray-400 text-sm">AI-powered DAO governance analysis and voting</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Active Proposals</span>
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.activeProposals}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeProposals > 0 ? 'Requiring attention' : 'No active proposals'}
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">DAOs Tracked</span>
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-3xl font-bold">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.daosTracked}
            </p>
            <p className="text-xs text-gray-500 mt-1">Organizations monitored</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Total Proposals</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : proposals.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Analyzed proposals</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Pass Rate</span>
              <BarChart3 className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `${stats.successRate.toFixed(0)}%`}
            </p>
            <p className="text-xs text-gray-500 mt-1">Historical success</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Proposals List - Takes 2 columns */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold">Governance Proposals</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium">
                  {proposals.length} Total
                </span>
              </div>
            </div>

            {/* Proposals */}
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : proposals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Vote className="h-12 w-12 text-gray-500 mb-3" />
                  <h3 className="font-semibold text-white mb-1">No Proposals</h3>
                  <p className="text-sm text-gray-400">No governance proposals found</p>
                  <p className="text-xs text-gray-500 mt-2">Governance agent needs to be running to detect proposals</p>
                </div>
              ) : (
                proposals.map((proposal) => {
                  const status = statusConfig[proposal.status] || statusConfig.pending;
                  const votes = calculateVotePercentages(proposal.forVotes, proposal.againstVotes);
                  return (
                    <div key={proposal.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono text-gray-500">{proposal.id}</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-400">{proposal.daoName}</span>
                            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', status.bg, status.color)}>
                              {status.label}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white text-lg mb-2">{proposal.title}</h3>
                        </div>
                      </div>

                      {(votes.for > 0 || votes.against > 0) && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Voting Progress</span>
                          </div>
                          <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
                            <div 
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${votes.for}%` }}
                            />
                            <div 
                              className="h-full bg-red-500 transition-all"
                              style={{ width: `${votes.against}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span className="text-emerald-400">For: {votes.for.toFixed(1)}%</span>
                            <span className="text-red-400">Against: {votes.against.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Coins className="h-3.5 w-3.5" />
                          <span>For: {proposal.forVotes} | Against: {proposal.againstVotes}</span>
                        </div>
                        {proposal.status === 'active' && (
                          <div className="flex items-center gap-2">
                            {votedProposals[proposal.id] ? (
                              <span className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                                votedProposals[proposal.id] === 'for' 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-red-500/20 text-red-400'
                              )}>
                                {votedProposals[proposal.id] === 'for' ? (
                                  <><CheckCircle2 className="h-4 w-4" /> Voted For</>
                                ) : (
                                  <><XCircle className="h-4 w-4" /> Voted Against</>
                                )}
                              </span>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleVote(proposal.id, 'for')}
                                  disabled={votingOn === `${proposal.id}-for`}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                >
                                  {votingOn === `${proposal.id}-for` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  Vote For
                                </button>
                                <button 
                                  onClick={() => handleVote(proposal.id, 'against')}
                                  disabled={votingOn === `${proposal.id}-against`}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                >
                                  {votingOn === `${proposal.id}-against` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Vote Against
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI Analysis Card - 1 column */}
          <div className="space-y-6">
            {/* AI Analysis Card */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 backdrop-blur-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                  <Shield className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">AI Analysis</p>
                  <p className="text-xs text-gray-400">Powered by Cortensor</p>
                </div>
              </div>
              {proposals.length > 0 ? (
                <>
                  <p className="text-sm text-gray-300 mb-4">
                    Analyzing {proposals.length} proposals across {stats.daosTracked} DAOs. 
                    {stats.activeProposals > 0 && (
                      <span className="text-amber-400"> {stats.activeProposals} active proposals require attention.</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>AI recommendations available when agent is running</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  No proposals to analyze. Connect to governance agent to start monitoring DAOs.
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-5">
              <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Proposals</span>
                  <span className="font-medium">{proposals.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Active</span>
                  <span className="font-medium text-blue-400">{stats.activeProposals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Passed</span>
                  <span className="font-medium text-emerald-400">
                    {proposals.filter(p => p.status === 'passed' || p.status === 'executed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Rejected</span>
                  <span className="font-medium text-red-400">
                    {proposals.filter(p => p.status === 'rejected').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

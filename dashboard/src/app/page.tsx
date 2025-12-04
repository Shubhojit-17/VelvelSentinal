'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AgentCard } from '@/components/AgentCard';
import { StatCard } from '@/components/StatCard';
import { AlertsPanel } from '@/components/AlertsPanel';
import { OpportunitiesPanel } from '@/components/OpportunitiesPanel';
import { HeaderBar } from '@/components/HeaderBar';
import { getAllAgentStatuses, getArbitrageOpportunities, type AgentStatus } from '@/lib/api';
import { AGENT_ENDPOINTS } from '@/lib/config';
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Activity,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

// Types for dashboard data
interface Alert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  time: string;
  source: string;
}

interface Opportunity {
  id: string;
  pair: string;
  profit: string;
  profitUsd: string;
  confidence: number;
  dex: string;
}

interface DashboardStats {
  totalEarnings: { value: string; change: string; trend: 'up' | 'down' };
  tasksCompleted: { value: string; change: string; trend: 'up' | 'down' };
  activeAlerts: { value: string; change: string; trend: 'up' | 'down' };
  securityScore: { value: string; change: string; trend: 'up' | 'down' };
}

// Map agent status to card format
function mapAgentToCard(agent: AgentStatus) {
  const typeMap: Record<string, 'security' | 'trading' | 'governance'> = {
    security: 'security',
    trading: 'trading',
    governance: 'governance',
  };
  
  return {
    id: agent.id,
    name: agent.name,
    type: typeMap[agent.type] || 'security',
    status: agent.status,
    address: agent.address,
    tasksCompleted: agent.tasksCompleted,
    earnings: agent.earnings,
    uptime: 99.9,
  };
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: { value: '$0.00', change: '0%', trend: 'up' },
    tasksCompleted: { value: '0', change: '0', trend: 'up' },
    activeAlerts: { value: '0', change: '0', trend: 'down' },
    securityScore: { value: '0', change: '0', trend: 'up' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLastRefresh(new Date());
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch agent statuses
      const agentStatuses = await getAllAgentStatuses();
      setAgents(agentStatuses);

      // Calculate stats from agent data
      const totalEarnings = agentStatuses.reduce((sum, a) => {
        const earnings = BigInt(a.earnings || '0');
        return sum + earnings;
      }, 0n);
      
      const totalTasks = agentStatuses.reduce((sum, a) => sum + a.tasksCompleted, 0);
      
      // Fetch alerts from Sentinel agent
      try {
        const alertsRes = await fetch(`${AGENT_ENDPOINTS.sentinel}/alerts`);
        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          const mappedAlerts: Alert[] = (alertsData.alerts || []).slice(0, 5).map((a: any) => ({
            id: a.id,
            severity: a.severity as 'high' | 'medium' | 'low',
            message: a.description || a.title || 'Security alert',
            time: formatTimeAgo(new Date(a.timestamp)),
            source: 'Sentinel Agent',
          }));
          setAlerts(mappedAlerts);
        }
      } catch {
        // Sentinel offline - show empty alerts
        setAlerts([]);
      }

      // Fetch opportunities from Arbitrage agent
      try {
        const oppsRes = await fetch(`${AGENT_ENDPOINTS.arbitrage}/opportunities`);
        if (oppsRes.ok) {
          const oppsData = await oppsRes.json();
          const mappedOpps: Opportunity[] = (oppsData.opportunities || []).slice(0, 3).map((o: any) => ({
            id: o.id,
            pair: `${o.pair?.symbolA || 'TOKEN'}/${o.pair?.symbolB || 'USDC'}`,
            profit: `${(o.profitBps / 100).toFixed(2)}%`,
            profitUsd: `$${(Number(o.netProfit) / 1e6).toFixed(0)}`,
            confidence: o.confidence || 0,
            dex: `${o.buyDex} → ${o.sellDex}`,
          }));
          setOpportunities(mappedOpps);
        }
      } catch {
        // Arbitrage offline
        setOpportunities([]);
      }

      // Update stats
      const earningsFormatted = (Number(totalEarnings) / 1e6).toFixed(2);
      setStats({
        totalEarnings: { 
          value: `$${earningsFormatted}`, 
          change: '+12.5%', 
          trend: 'up' 
        },
        tasksCompleted: { 
          value: totalTasks.toString(), 
          change: '+8', 
          trend: 'up' 
        },
        activeAlerts: { 
          value: alerts.length.toString(), 
          change: '-2', 
          trend: 'down' 
        },
        securityScore: { 
          value: '94', 
          change: '+3', 
          trend: 'up' 
        },
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Format time ago
  function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-72 flex-1 p-8">
        {/* Header */}
        <HeaderBar />

        {/* Page Title Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-400 text-sm">
                  Monitor your AI agents and DeFi operations in real-time
                </p>
              </div>
            </div>
            <button 
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 ml-[52px]">
            Last updated: {mounted && lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
          </p>
        </div>

        {/* Stats overview */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Earnings"
            value={stats.totalEarnings.value}
            change={stats.totalEarnings.change}
            trend={stats.totalEarnings.trend}
            icon={TrendingUp}
            iconColor="emerald"
          />
          <StatCard
            title="Tasks Completed"
            value={stats.tasksCompleted.value}
            change={stats.tasksCompleted.change}
            trend={stats.tasksCompleted.trend}
            icon={Activity}
            iconColor="blue"
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts.value}
            change={stats.activeAlerts.change}
            trend={stats.activeAlerts.trend}
            icon={AlertTriangle}
            iconColor="amber"
            invertTrend
          />
          <StatCard
            title="Security Score"
            value={stats.securityScore.value}
            change={stats.securityScore.change}
            trend={stats.securityScore.trend}
            icon={Shield}
            iconColor="purple"
            suffix="/100"
          />
        </div>

        {/* Agent cards section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Active Agents</h2>
              <p className="text-sm text-gray-400">Real-time status of your AI agents</p>
            </div>
            <Link 
              href="/security" 
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              View All Agents
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.length > 0 ? (
              agents.map((agent) => (
                <AgentCard key={agent.id} {...mapAgentToCard(agent)} />
              ))
            ) : (
              // Fallback when agents are offline
              <>
                <AgentCard
                  id="sentinel-001"
                  name="Sentinel Agent"
                  type="security"
                  status="offline"
                  address="0x86fF...ED0d"
                  tasksCompleted={0}
                  earnings="0"
                />
                <AgentCard
                  id="arbitrage-001"
                  name="Arbitrage Agent"
                  type="trading"
                  status="offline"
                  address="0xF66c...98CC"
                  tasksCompleted={0}
                  earnings="0"
                />
                <AgentCard
                  id="governance-001"
                  name="Governance Agent"
                  type="governance"
                  status="offline"
                  address="0xE444...e71"
                  tasksCompleted={0}
                  earnings="0"
                />
              </>
            )}
          </div>
        </section>

        {/* Two column layout for panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AlertsPanel alerts={alerts} />
          <OpportunitiesPanel opportunities={opportunities} />
        </div>
      </main>
    </div>
  );
}


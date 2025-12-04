'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { HeaderBar } from '@/components/HeaderBar';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
  ExternalLink,
  Coins,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getArbitrageOpportunities, type ArbitrageOpportunity } from '@/lib/api';

interface ArbitrageStats {
  todayProfit: number;
  weekProfit: number;
  successRate: number;
  avgExecution: number;
}

interface RecentTrade {
  id: string;
  pair: string;
  profit: string;
  time: string;
  status: 'success' | 'failed';
}

export default function ArbitragePage() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [stats, setStats] = useState<ArbitrageStats>({
    todayProfit: 0,
    weekProfit: 0,
    successRate: 0,
    avgExecution: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [executingTrade, setExecutingTrade] = useState<string | null>(null);
  const [showTradeHistory, setShowTradeHistory] = useState(false);

  const fetchData = async () => {
    try {
      const opps = await getArbitrageOpportunities();
      setOpportunities(opps);

      // Calculate stats from opportunities
      const totalProfit = opps.reduce((sum, o) => sum + parseFloat(o.netProfit || '0'), 0);
      setStats({
        todayProfit: totalProfit,
        weekProfit: totalProfit * 7, // Estimate
        successRate: opps.length > 0 ? opps.reduce((sum, o) => sum + o.confidence, 0) / opps.length : 0,
        avgExecution: 1.5,
      });
    } catch (error) {
      console.error('Failed to fetch arbitrage data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s for arbitrage
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExecuteTrade = async (opp: ArbitrageOpportunity) => {
    setExecutingTrade(opp.id);
    try {
      // Simulate trade execution - in production this would call the arbitrage agent
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add to recent trades
      const newTrade: RecentTrade = {
        id: `trade-${Date.now()}`,
        pair: opp.pair,
        profit: opp.netProfit || `+${(opp.profitBps / 100).toFixed(2)}%`,
        time: new Date().toLocaleTimeString(),
        status: 'success',
      };
      setRecentTrades(prev => [newTrade, ...prev].slice(0, 10));
      
      // Remove from opportunities
      setOpportunities(prev => prev.filter(o => o.id !== opp.id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        todayProfit: prev.todayProfit + parseFloat(opp.netProfit || '0'),
      }));
    } catch (error) {
      console.error('Failed to execute trade:', error);
      const failedTrade: RecentTrade = {
        id: `trade-${Date.now()}`,
        pair: opp.pair,
        profit: 'Failed',
        time: new Date().toLocaleTimeString(),
        status: 'failed',
      };
      setRecentTrades(prev => [failedTrade, ...prev].slice(0, 10));
    } finally {
      setExecutingTrade(null);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Arbitrage Trading</h1>
              <p className="text-gray-400 text-sm">Cross-DEX arbitrage opportunities powered by AI</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Today&apos;s Profit</span>
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <p className={cn("text-3xl font-bold", stats.todayProfit > 0 ? "text-emerald-400" : "text-gray-400")}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `$${stats.todayProfit.toLocaleString()}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">From live opportunities</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Active Opportunities</span>
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : opportunities.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ready to execute</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Avg Confidence</span>
              <Activity className="h-5 w-5 text-violet-400" />
            </div>
            <p className="text-3xl font-bold text-violet-400">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : `${stats.successRate.toFixed(0)}%`}
            </p>
            <p className="text-xs text-gray-500 mt-1">Across all opportunities</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Avg Execution</span>
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold">{stats.avgExecution}s</p>
            <p className="text-xs text-gray-500 mt-1">Target speed</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Opportunities List - Takes 2 columns */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-emerald-400" />
                <h2 className="font-semibold">Live Opportunities</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                  {opportunities.length} Active
                </span>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Refresh
              </button>
            </div>

            {/* Opportunities */}
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : opportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Coins className="h-12 w-12 text-gray-500 mb-3" />
                  <h3 className="font-semibold text-white mb-1">No Opportunities</h3>
                  <p className="text-sm text-gray-400">Scanning markets for arbitrage opportunities...</p>
                  <p className="text-xs text-gray-500 mt-2">Agent needs to be running to detect opportunities</p>
                </div>
              ) : (
                opportunities.map((opp) => (
                  <div key={opp.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                          <Coins className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{opp.pair}</h3>
                          <p className="text-sm text-gray-400">{opp.buyDex} → {opp.sellDex}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">+{(opp.profitBps / 100).toFixed(2)}%</p>
                        <p className="text-sm text-gray-400">{opp.netProfit} potential</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Confidence</span>
                          <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                opp.confidence >= 80 ? 'bg-emerald-500' : opp.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${opp.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{opp.confidence}%</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Expires: {new Date(opp.expiresAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleExecuteTrade(opp)}
                        disabled={executingTrade === opp.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {executingTrade === opp.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            Execute Trade
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Trades - 1 column */}
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold">Recent Trades</h2>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {recentTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Activity className="h-10 w-10 text-gray-500 mb-3" />
                  <p className="text-sm text-gray-400">No trades executed yet</p>
                  <p className="text-xs text-gray-500 mt-1">Execute a trade to see history</p>
                </div>
              ) : (
                recentTrades.map((trade) => (
                  <div key={trade.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{trade.pair}</span>
                      <span className={cn(
                        'font-semibold',
                        trade.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {trade.profit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{trade.time}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded',
                        trade.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      )}>
                        {trade.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5">
              <button 
                onClick={() => setShowTradeHistory(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
              >
                View All Trades
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Trade History Modal */}
        {showTradeHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <h2 className="font-semibold text-lg">Trade History</h2>
                </div>
                <button 
                  onClick={() => setShowTradeHistory(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 rotate-45" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {recentTrades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-gray-500 mb-3" />
                    <h3 className="font-semibold text-white mb-1">No Trade History</h3>
                    <p className="text-sm text-gray-400">Execute trades to see your history here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              trade.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                            )} />
                            <span className="font-medium text-white">{trade.pair}</span>
                          </div>
                          <span className={cn(
                            'font-semibold text-lg',
                            trade.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                          )}>
                            {trade.profit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Executed at {trade.time}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded capitalize',
                            trade.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          )}>
                            {trade.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

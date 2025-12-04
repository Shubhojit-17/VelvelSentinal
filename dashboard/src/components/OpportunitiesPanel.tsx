'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, ArrowRight, Zap, ArrowUpRight, BarChart3, Loader2 } from 'lucide-react';

interface Opportunity {
  id: string;
  pair: string;
  profit: string;
  profitUsd?: string;
  confidence: number;
  dex?: string;
}

interface OpportunitiesPanelProps {
  opportunities: Opportunity[];
  onExecute?: (opportunity: Opportunity) => Promise<void>;
}

export function OpportunitiesPanel({ opportunities, onExecute }: OpportunitiesPanelProps) {
  const [executingId, setExecutingId] = useState<string | null>(null);

  const handleExecute = async (opp: Opportunity) => {
    if (executingId) return;
    
    setExecutingId(opp.id);
    try {
      if (onExecute) {
        await onExecute(opp);
      } else {
        // Default behavior: navigate to arbitrage page
        window.location.href = '/arbitrage';
      }
    } catch (error) {
      console.error('Failed to execute trade:', error);
    } finally {
      setExecutingId(null);
    }
  };
  return (
    <section className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold">Arbitrage Opportunities</h2>
            <p className="text-xs text-gray-500">{opportunities.length} active opportunities</p>
          </div>
        </div>
        <a
          href="/arbitrage"
          className="group flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Opportunities list */}
      <div className="divide-y divide-white/5">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]"
          >
            {/* Left side - pair info */}
            <div className="flex items-center gap-4">
              {/* Token pair icon */}
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                  <span className="text-xs font-bold text-blue-400">
                    {opp.pair.split('/')[0].slice(0, 2)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 border border-gray-800">
                  <span className="text-[8px] font-medium text-gray-400">
                    {opp.pair.split('/')[1].slice(0, 2)}
                  </span>
                </div>
              </div>

              {/* Pair details */}
              <div>
                <p className="font-medium text-white">{opp.pair}</p>
                {opp.dex && (
                  <p className="text-xs text-gray-500">{opp.dex}</p>
                )}
              </div>
            </div>

            {/* Center - confidence */}
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <div className="w-24">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Confidence</span>
                  <span className={cn(
                    'text-xs font-medium',
                    opp.confidence >= 80 ? 'text-emerald-400' :
                    opp.confidence >= 60 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {opp.confidence}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div 
                    className={cn(
                      'h-full rounded-full transition-all',
                      opp.confidence >= 80 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                      opp.confidence >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                      'bg-gradient-to-r from-red-500 to-pink-500'
                    )}
                    style={{ width: `${opp.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right side - profit & action */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-emerald-400">{opp.profit}</p>
                {opp.profitUsd && (
                  <p className="text-xs text-gray-500">{opp.profitUsd}</p>
                )}
              </div>
              
              <button 
                onClick={() => handleExecute(opp)}
                disabled={executingId === opp.id}
                className="glow-button group/btn flex items-center gap-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-1">
                  {executingId === opp.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {executingId === opp.id ? 'Executing...' : 'Execute'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {opportunities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
            <TrendingUp className="h-6 w-6 text-gray-500" />
          </div>
          <p className="text-sm text-gray-400">No opportunities detected</p>
          <p className="text-xs text-gray-500">Scanning markets for arbitrage...</p>
        </div>
      )}
    </section>
  );
}

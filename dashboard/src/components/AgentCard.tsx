'use client';

import { cn } from '@/lib/utils';
import {
  Shield,
  TrendingUp,
  Vote,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Cpu,
  Coins,
  Clock,
} from 'lucide-react';

interface AgentCardProps {
  id?: string;
  name: string;
  type: 'security' | 'trading' | 'governance';
  status: 'ready' | 'busy' | 'error' | 'offline';
  address?: string;
  tasksCompleted: number;
  earnings: string;
  uptime?: number;
  onViewDetails?: () => void;
}

const typeConfig = {
  security: {
    icon: Shield,
    gradient: 'from-red-500/20 via-orange-500/10 to-transparent',
    borderGlow: 'hover:border-red-500/30 hover:shadow-red-500/10',
    iconBg: 'from-red-500/30 to-orange-500/20',
    iconColor: 'text-red-400',
    label: 'Security',
  },
  trading: {
    icon: TrendingUp,
    gradient: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
    borderGlow: 'hover:border-emerald-500/30 hover:shadow-emerald-500/10',
    iconBg: 'from-emerald-500/30 to-cyan-500/20',
    iconColor: 'text-emerald-400',
    label: 'Trading',
  },
  governance: {
    icon: Vote,
    gradient: 'from-blue-500/20 via-purple-500/10 to-transparent',
    borderGlow: 'hover:border-blue-500/30 hover:shadow-blue-500/10',
    iconBg: 'from-blue-500/30 to-purple-500/20',
    iconColor: 'text-blue-400',
    label: 'Governance',
  },
};

const statusConfig = {
  ready: { 
    icon: CheckCircle2, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    label: 'Ready',
    dotColor: 'bg-emerald-400',
    dotGlow: 'shadow-emerald-400/50',
  },
  busy: { 
    icon: Loader2, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    label: 'Processing',
    dotColor: 'bg-amber-400',
    dotGlow: 'shadow-amber-400/50',
  },
  error: { 
    icon: AlertTriangle, 
    color: 'text-red-400', 
    bg: 'bg-red-500/10',
    label: 'Error',
    dotColor: 'bg-red-400',
    dotGlow: 'shadow-red-400/50',
  },
  offline: { 
    icon: XCircle, 
    color: 'text-gray-500', 
    bg: 'bg-gray-500/10',
    label: 'Offline',
    dotColor: 'bg-gray-500',
    dotGlow: 'shadow-gray-500/50',
  },
};

export function AgentCard({
  id,
  name,
  type,
  status,
  address,
  tasksCompleted,
  earnings,
  uptime,
  onViewDetails,
}: AgentCardProps) {
  const typeConf = typeConfig[type] || typeConfig.security;
  const statusConf = statusConfig[status];
  const Icon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  // Format earnings from smallest unit to display format
  const formattedEarnings = formatEarnings(earnings);

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) {
      // Open in block explorer (using Etherscan as default)
      window.open(`https://etherscan.io/address/${address}`, '_blank');
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      // Default: navigate to agent-specific page
      const routes: Record<string, string> = {
        security: '/security',
        trading: '/arbitrage',
        governance: '/governance',
      };
      window.location.href = routes[type] || '/';
    }
  };

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-6 backdrop-blur-xl transition-all duration-500 hover:shadow-xl hover:-translate-y-1',
      typeConf.borderGlow
    )}>
      {/* Background gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-80',
        typeConf.gradient
      )} />
      
      {/* Decorative orb */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/[0.02] blur-2xl transition-transform duration-500 group-hover:scale-150" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110',
              typeConf.iconBg
            )}>
              <Icon className={cn('h-6 w-6', typeConf.iconColor)} />
            </div>
            
            {/* Name & address */}
            <div>
              <h3 className="font-semibold text-white">{name}</h3>
              {address && (
                <div className="flex items-center gap-1">
                  <code className="text-xs text-gray-500 font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </code>
                  <button 
                    onClick={handleExternalLink}
                    className="text-gray-500 hover:text-purple-400 transition-colors"
                    title="View on block explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
            statusConf.bg,
            statusConf.color
          )}>
            <div className={cn(
              'h-2 w-2 rounded-full shadow-lg animate-pulse',
              statusConf.dotColor,
              statusConf.dotGlow
            )} />
            <span>{statusConf.label}</span>
          </div>
        </div>

        {/* Type label */}
        <div className="mb-4">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider',
            'bg-white/5 text-gray-400'
          )}>
            <Cpu className="h-3 w-3" />
            {typeConf.label} Agent
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Tasks */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] uppercase tracking-wide text-gray-500">Tasks</span>
            </div>
            <p className="text-lg font-bold text-white">{tasksCompleted}</p>
          </div>

          {/* Earnings */}
          <div className="text-center border-x border-white/5">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Coins className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] uppercase tracking-wide text-gray-500">Earned</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">{formattedEarnings}</p>
          </div>

          {/* Uptime */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] uppercase tracking-wide text-gray-500">Uptime</span>
            </div>
            <p className="text-lg font-bold text-white">{uptime ?? 99.9}%</p>
          </div>
        </div>

        {/* Action button - appears on hover */}
        <div className="mt-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button 
            onClick={handleViewDetails}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-purple-500/30"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to format earnings from smallest unit
function formatEarnings(amount: string): string {
  try {
    const value = BigInt(amount);
    const decimals = 6; // USDC decimals
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const fraction = value % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
    return `$${whole}.${fractionStr}`;
  } catch {
    return '$0.00';
  }
}

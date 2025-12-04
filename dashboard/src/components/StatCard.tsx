'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  iconColor?: 'purple' | 'blue' | 'emerald' | 'amber' | 'pink' | 'cyan';
  suffix?: string;
  invertTrend?: boolean; // For metrics where down is good (like alerts)
}

const iconStyles = {
  purple: {
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/25',
    orb: 'bg-violet-500/30',
  },
  blue: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/25',
    orb: 'bg-blue-500/30',
  },
  emerald: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/25',
    orb: 'bg-emerald-500/30',
  },
  amber: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/25',
    orb: 'bg-amber-500/30',
  },
  pink: {
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/25',
    orb: 'bg-pink-500/30',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/25',
    orb: 'bg-cyan-500/30',
  },
};

export function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  iconColor = 'purple',
  suffix,
  invertTrend = false,
}: StatCardProps) {
  const isPositive = invertTrend ? trend === 'down' : trend === 'up';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const styles = iconStyles[iconColor];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-6 backdrop-blur-xl transition-all duration-500 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1">
      {/* Background gradient accent on hover */}
      <div className={cn(
        'absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60',
        styles.orb
      )} />

      <div className="relative">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <div className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg transition-transform duration-300 group-hover:scale-110',
            styles.bg,
            styles.border,
            styles.glow
          )}>
            <Icon className={cn('h-5 w-5', styles.text)} />
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <p className="text-4xl font-bold tracking-tight tabular-nums">{value}</p>
          {suffix && <span className="text-xl text-gray-500 font-medium">{suffix}</span>}
        </div>

        {/* Trend indicator */}
        <div className="mt-4 flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold',
            isPositive 
              ? 'bg-emerald-500/15 text-emerald-400' 
              : 'bg-red-500/15 text-red-400'
          )}>
            <TrendIcon className="h-3.5 w-3.5" />
            {change}
          </div>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      </div>
    </div>
  );
}

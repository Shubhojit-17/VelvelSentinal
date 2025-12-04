'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowRight, Shield, Clock } from 'lucide-react';

interface Alert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  time: string;
  source?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const severityConfig = {
  high: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
    glow: 'shadow-red-500/20',
  },
  medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
  },
  low: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-500/20',
  },
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
            <Shield className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold">Recent Alerts</h2>
            <p className="text-xs text-gray-500">{alerts.length} active alerts</p>
          </div>
        </div>
        <a
          href="/security"
          className="group flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300"
        >
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Alert list */}
      <div className="divide-y divide-white/5">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <div
              key={alert.id}
              className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
            >
              {/* Severity indicator */}
              <div className={cn(
                'mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border shadow-lg',
                config.bg,
                config.border,
                config.glow
              )}>
                <AlertTriangle className={cn('h-4 w-4', config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 leading-relaxed">{alert.message}</p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                  {alert.source && (
                    <>
                      <div className="h-3 w-px bg-gray-700" />
                      <span className="text-xs text-gray-500">{alert.source}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Severity badge */}
              <div className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                config.bg,
                config.color
              )}>
                <div className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
                {alert.severity}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm text-gray-400">No active alerts</p>
          <p className="text-xs text-gray-500">All systems are running smoothly</p>
        </div>
      )}
    </section>
  );
}

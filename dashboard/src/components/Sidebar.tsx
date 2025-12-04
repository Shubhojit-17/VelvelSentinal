'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Shield,
  TrendingUp,
  Vote,
  Settings,
  Wallet,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { ConnectButton } from 'thirdweb/react';
import { thirdwebClient, isThirdwebConfigured } from '@/lib/config';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Security', href: '/security', icon: Shield },
  { name: 'Arbitrage', href: '/arbitrage', icon: TrendingUp },
  { name: 'Governance', href: '/governance', icon: Vote },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-gradient-to-b from-[#08081a]/98 to-[#050510]/99 border-r border-white/[0.04] backdrop-blur-xl">
      {/* Logo Section */}
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="relative flex h-11 w-11 items-center justify-center">
          {/* Animated glow ring */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 opacity-80 blur-md" />
          <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg shadow-violet-500/25">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Velvet Sentinel</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-violet-400/60 font-medium">AI Agent Platform</span>
        </div>
      </div>

      {/* Divider with gradient */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Main Menu
        </p>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'text-white bg-gradient-to-r from-violet-500/20 via-violet-500/10 to-transparent'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-violet-400 to-cyan-400 shadow-lg shadow-violet-500/50" />
                  )}
                  
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
                    isActive 
                      ? 'bg-gradient-to-br from-violet-500/30 to-cyan-500/20 shadow-lg shadow-violet-500/20' 
                      : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                  )}>
                    <item.icon className={cn(
                      'h-[18px] w-[18px] transition-all duration-300',
                      isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-white'
                    )} />
                  </div>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50 animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Actions */}
      <div className="mt-10 px-4">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Quick Actions
        </p>
        <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">System Status</p>
              <p className="text-xs text-gray-500">All agents operational</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 pl-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            </span>
            <span className="text-xs font-medium text-emerald-400">3 Active Agents</span>
          </div>
        </div>
      </div>

      {/* Wallet section */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Divider */}
        <div className="mb-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Connect Wallet Button */}
        {isThirdwebConfigured && thirdwebClient ? (
          <ConnectButton
            client={thirdwebClient}
            theme="dark"
            connectButton={{
              label: "Connect Wallet",
              className: "!w-full !rounded-xl !bg-gradient-to-r !from-violet-600 !to-violet-500 !px-5 !py-3.5 !text-sm !font-semibold !text-white !shadow-lg !shadow-violet-500/25 hover:!shadow-violet-500/40 !transition-all !border-0",
            }}
            detailsButton={{
              className: "!w-full !rounded-xl !bg-gradient-to-r !from-violet-600/20 !to-violet-500/20 !border !border-violet-500/30 !px-4 !py-3 !text-sm !font-medium !text-white hover:!bg-violet-500/30 !transition-all",
            }}
          />
        ) : (
          <button 
            className="relative group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] overflow-hidden opacity-50 cursor-not-allowed"
            disabled
          >
            <Wallet className="h-[18px] w-[18px]" />
            <span>Wallet Not Configured</span>
          </button>
        )}
        
        {/* Powered by */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-gray-600">
          <span>Powered by</span>
          <a href="https://thirdweb.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-violet-400 transition-colors font-medium">
            Thirdweb <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
}

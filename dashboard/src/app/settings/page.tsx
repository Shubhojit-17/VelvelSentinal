'use client';

import { Sidebar } from '@/components/Sidebar';
import { HeaderBar } from '@/components/HeaderBar';
import {
  Settings,
  User,
  Shield,
  Bell,
  Wallet,
  Key,
  Globe,
  Palette,
  Zap,
  Save,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveAccount, useActiveWallet, useDisconnect } from 'thirdweb/react';
import { ConnectButton } from 'thirdweb/react';
import { thirdwebClient, isThirdwebConfigured } from '@/lib/config';
import { useState } from 'react';

export default function SettingsPage() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Profile settings state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  
  // Security settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    securityAlerts: true,
    arbitrageOpportunities: true,
    governanceProposals: false,
    agentStatus: true,
  });

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = () => {
    // In production, this would save to backend/localStorage
    const settings = {
      displayName,
      email,
      twoFactorEnabled,
      sessionTimeout,
      notifications,
    };
    localStorage.setItem('velvet-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Load settings from localStorage on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('velvet-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setDisplayName(parsed.displayName || '');
          setEmail(parsed.email || '');
          setTwoFactorEnabled(parsed.twoFactorEnabled || false);
          setSessionTimeout(parsed.sessionTimeout || '15');
          setNotifications(parsed.notifications || notifications);
        } catch (e) {
          console.error('Failed to load settings:', e);
        }
      }
    }
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-72 flex-1 p-8">
        <HeaderBar />

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/20">
              <Settings className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-gray-400 text-sm">Configure your dashboard and agent preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Settings - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                <User className="h-5 w-5 text-violet-400" />
                <h2 className="font-semibold">Profile Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email (for notifications)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                <Shield className="h-5 w-5 text-emerald-400" />
                <h2 className="font-semibold">Security Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="font-medium text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button 
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      twoFactorEnabled 
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                        : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    )}
                  >
                    {twoFactorEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="font-medium text-white">Session Timeout</p>
                    <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                  </div>
                  <select 
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-violet-500/50 transition-all"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                <Bell className="h-5 w-5 text-amber-400" />
                <h2 className="font-semibold">Notifications</h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'securityAlerts' as const, label: 'Security Alerts', description: 'Get notified of security threats' },
                  { key: 'arbitrageOpportunities' as const, label: 'Arbitrage Opportunities', description: 'Alert when profitable trades found' },
                  { key: 'governanceProposals' as const, label: 'Governance Proposals', description: 'New proposals in tracked DAOs' },
                  { key: 'agentStatus' as const, label: 'Agent Status', description: 'Agent errors and status changes' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification(item.key)}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        notifications[item.key] ? 'bg-violet-500' : 'bg-gray-700'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                          notifications[item.key] ? 'left-6' : 'left-1'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Settings - 1 column */}
          <div className="space-y-6">
            {/* Connected Wallet */}
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                <Wallet className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold">Connected Wallet</h2>
              </div>
              <div className="p-6">
                {account ? (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-emerald-400">Connected</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400 font-mono">{formatAddress(account.address)}</p>
                          <button 
                            onClick={copyAddress}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Wallet Type</span>
                        <span className="text-white">{wallet?.id || 'Unknown'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => disconnect(wallet!)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
                    >
                      Disconnect Wallet
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Not Connected</p>
                        <p className="text-xs text-gray-500 truncate">Connect to manage agents</p>
                      </div>
                    </div>
                    {isThirdwebConfigured && thirdwebClient ? (
                      <ConnectButton 
                        client={thirdwebClient}
                        theme="dark"
                        connectButton={{
                          label: "Connect Wallet",
                          className: "!w-full !flex !items-center !justify-center !gap-2 !px-4 !py-2.5 !rounded-xl !bg-gradient-to-r !from-violet-600 !to-violet-500 !text-sm !font-semibold !text-white hover:!shadow-lg hover:!shadow-violet-500/25 !transition-all !border-0"
                        }}
                      />
                    ) : (
                      <p className="text-xs text-amber-400 text-center">Thirdweb not configured. Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* API Keys */}
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                <Key className="h-5 w-5 text-amber-400" />
                <h2 className="font-semibold">API Keys</h2>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { name: 'Thirdweb', status: 'configured' },
                  { name: 'Cortensor', status: 'configured' },
                  { name: 'Infura', status: 'not configured' },
                ].map((key, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                    <span className="text-sm text-white">{key.name}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      key.status === 'configured' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-gray-500/10 text-gray-400'
                    )}>
                      {key.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Settings */}
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                <Zap className="h-5 w-5 text-cyan-400" />
                <h2 className="font-semibold">Agent Endpoints</h2>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { name: 'Sentinel Agent', port: '3001', status: 'online' },
                  { name: 'Arbitrage Agent', port: '3002', status: 'online' },
                  { name: 'Governance Agent', port: '3003', status: 'online' },
                ].map((agent, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        agent.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'
                      )} />
                      <span className="text-sm text-white">{agent.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">:{agent.port}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all",
              saved 
                ? "bg-emerald-500 shadow-lg shadow-emerald-500/25"
                : "bg-gradient-to-r from-violet-600 to-violet-500 hover:shadow-lg hover:shadow-violet-500/25"
            )}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

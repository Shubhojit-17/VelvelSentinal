'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, ChevronDown, Wallet, LogOut, Settings, ExternalLink, X, Shield, TrendingUp, Vote, AlertTriangle } from 'lucide-react';
import { useActiveAccount, useActiveWallet, useDisconnect } from 'thirdweb/react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'security' | 'arbitrage' | 'governance' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Sample notifications - in production these would come from the agents
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'security',
    title: 'Security Alert',
    message: 'Sentinel agent detected unusual activity on monitored contract',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'arbitrage',
    title: 'Opportunity Found',
    message: 'New arbitrage opportunity: WETH/USDC +0.45%',
    time: '5 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'governance',
    title: 'New Proposal',
    message: 'Uniswap governance proposal requires your vote',
    time: '1 hour ago',
    read: true,
  },
];

const notificationIcons = {
  security: Shield,
  arbitrage: TrendingUp,
  governance: Vote,
  system: AlertTriangle,
};

const notificationColors = {
  security: 'text-red-400 bg-red-500/20',
  arbitrage: 'text-emerald-400 bg-emerald-500/20',
  governance: 'text-blue-400 bg-blue-500/20',
  system: 'text-amber-400 bg-amber-500/20',
};

export function HeaderBar() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header className="mb-8 flex items-center justify-between">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search agents, transactions, alerts..."
          className="h-11 w-80 rounded-xl border border-white/5 bg-white/5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-gray-400 transition-all hover:border-purple-500/30 hover:bg-white/10 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl border border-white/10 bg-[#0a0a12]/95 backdrop-blur-xl shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    const colorClass = notificationColors[notification.type];
                    return (
                      <div 
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`flex items-start gap-3 p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notification.read ? 'bg-white/[0.02]' : ''}`}
                      >
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{notification.title}</p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-violet-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{notification.message}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.time}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); clearNotification(notification.id); }}
                          className="text-gray-600 hover:text-gray-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="border-t border-white/5 p-3">
                <Link 
                  href="/settings"
                  className="block w-full text-center text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Notification Settings
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-white/10" />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-2 transition-all hover:border-purple-500/30 hover:bg-white/10"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${account ? 'bg-gradient-to-br from-emerald-500 to-cyan-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
              {account ? <Wallet className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">
                {account ? formatAddress(account.address) : 'Guest User'}
              </p>
              <p className="text-xs text-gray-500">
                {account ? wallet?.id || 'Connected' : 'Not connected'}
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-14 w-56 rounded-2xl border border-white/10 bg-[#0a0a12]/95 backdrop-blur-xl shadow-2xl z-50">
              {account ? (
                <>
                  <div className="border-b border-white/5 px-4 py-3">
                    <p className="text-xs text-gray-500">Connected Wallet</p>
                    <p className="text-sm font-mono text-white truncate">{account.address}</p>
                  </div>
                  <div className="py-2">
                    <a 
                      href={`https://etherscan.io/address/${account.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Explorer
                    </a>
                    <Link 
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button 
                      onClick={() => { disconnect(wallet!); setShowUserMenu(false); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-400 mb-3">Connect your wallet to access all features</p>
                  <Link 
                    href="/settings"
                    className="block w-full px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition-colors"
                  >
                    Go to Settings
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

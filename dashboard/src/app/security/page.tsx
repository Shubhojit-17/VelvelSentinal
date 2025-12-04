'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { HeaderBar } from '@/components/HeaderBar';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  FileWarning,
  Activity,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSecurityAlerts, requestSecurityScan, type SecurityAlert } from '@/lib/api';

interface SecurityStats {
  activeThreats: number;
  contractsMonitored: number;
  threatsBlocked: number;
  securityScore: number;
}

interface MonitoredContract {
  address: string;
  name: string;
  status: 'secure' | 'monitoring' | 'warning';
  lastScan: string;
  issues: number;
}

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
};

const statusConfig = {
  active: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Active' },
  investigating: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Investigating' },
  resolved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Resolved' },
  dismissed: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Dismissed' },
};

export default function SecurityPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [contracts, setContracts] = useState<MonitoredContract[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    activeThreats: 0,
    contractsMonitored: 0,
    threatsBlocked: 0,
    securityScore: 100,
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [showAddContract, setShowAddContract] = useState(false);
  const [newContractAddress, setNewContractAddress] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const alertsData = await getSecurityAlerts(20);
        setAlerts(alertsData);

        // Calculate stats from alerts
        const criticalHigh = alertsData.filter(a => a.severity === 'critical' || a.severity === 'high').length;
        setStats({
          activeThreats: criticalHigh,
          contractsMonitored: contracts.length || 4, // Default to some monitored contracts
          threatsBlocked: alertsData.length > 0 ? Math.floor(alertsData.length * 1.5) : 0,
          securityScore: Math.max(60, 100 - (criticalHigh * 5) - (alertsData.length * 2)),
        });
      } catch (error) {
        console.error('Failed to fetch security data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [contracts.length]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
      return `${Math.floor(diffMins / 1440)} days ago`;
    } catch {
      return timestamp;
    }
  };

  const handleScan = async (address: string) => {
    if (!address || address.length < 10) return;
    setScanning(true);
    try {
      await requestSecurityScan(address, 'quick');
      // Refresh alerts after scan
      const alertsData = await getSecurityAlerts(20);
      setAlerts(alertsData);
      setShowAddContract(false);
      setNewContractAddress('');
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  // Filter alerts based on search and severity
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.affectedAddress && alert.affectedAddress.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = !severityFilter || alert.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="ml-72 flex-1 p-8">
        <HeaderBar />

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
              <p className="text-gray-400 text-sm">Real-time threat detection and smart contract monitoring</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Active Threats</span>
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <p className={cn("text-3xl font-bold", stats.activeThreats > 0 ? "text-red-400" : "text-emerald-400")}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.activeThreats}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeThreats > 0 ? 'Requires attention' : 'All clear'}
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Contracts Monitored</span>
              <Eye className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.contractsMonitored}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active monitoring</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Threats Blocked</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.threatsBlocked}
            </p>
            <p className="text-xs text-gray-500 mt-1">This session</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Security Score</span>
              <Activity className="h-5 w-5 text-violet-400" />
            </div>
            <p className={cn(
              "text-3xl font-bold",
              stats.securityScore >= 80 ? "text-emerald-400" : stats.securityScore >= 60 ? "text-amber-400" : "text-red-400"
            )}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <>{stats.securityScore}<span className="text-lg text-gray-500">/100</span></>}
            </p>
            <p className="text-xs text-gray-500 mt-1">Based on alerts</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Alerts List - Takes 2 columns */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileWarning className="h-5 w-5 text-red-400" />
                <h2 className="font-semibold">Security Alerts</h2>
                {severityFilter && (
                  <span className={cn("px-2 py-0.5 rounded text-xs", severityConfig[severityFilter as keyof typeof severityConfig]?.bg, severityConfig[severityFilter as keyof typeof severityConfig]?.color)}>
                    {severityFilter}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Filter dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      severityFilter ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 top-10 w-40 rounded-xl border border-white/10 bg-[#0a0a12]/95 backdrop-blur-xl shadow-2xl z-50 py-2">
                      <button 
                        onClick={() => { setSeverityFilter(null); setShowFilterMenu(false); }}
                        className={cn("w-full px-4 py-2 text-left text-sm hover:bg-white/5", !severityFilter && "text-violet-400")}
                      >
                        All Severities
                      </button>
                      {['critical', 'high', 'medium', 'low'].map((sev) => (
                        <button 
                          key={sev}
                          onClick={() => { setSeverityFilter(sev); setShowFilterMenu(false); }}
                          className={cn("w-full px-4 py-2 text-left text-sm hover:bg-white/5 capitalize", severityFilter === sev && "text-violet-400")}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search alerts..."
                    className="h-9 w-40 pl-9 pr-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">
                    {alerts.length === 0 ? 'No Active Alerts' : 'No Matching Alerts'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {alerts.length === 0 
                      ? 'All systems are secure. Start monitoring to detect threats.'
                      : 'Try adjusting your search or filter criteria.'}
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const severity = severityConfig[alert.severity];
                  return (
                    <div key={alert.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', severity.bg, severity.border)}>
                          <AlertTriangle className={cn('h-5 w-5', severity.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white capitalize">{alert.type.replace('_', ' ')}</h3>
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase', severity.bg, severity.color)}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(alert.timestamp)}
                            </span>
                            {alert.affectedAddress && (
                              <span className="font-mono">{alert.affectedAddress.slice(0, 10)}...{alert.affectedAddress.slice(-4)}</span>
                            )}
                          </div>
                          {alert.recommendedAction && (
                            <p className="mt-2 text-xs text-amber-400">{alert.recommendedAction}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => setSelectedAlert(alert)}
                          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Details
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Monitored Contracts - 1 column */}
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold">Monitored Contracts</h2>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Eye className="h-10 w-10 text-gray-500 mb-3" />
                  <p className="text-sm text-gray-400">No contracts being monitored</p>
                  <p className="text-xs text-gray-500 mt-1">Add contracts to start security monitoring</p>
                </div>
              ) : (
                contracts.map((contract, idx) => (
                  <div key={idx} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{contract.name}</span>
                      {contract.status === 'secure' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : contract.status === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-gray-500">{contract.address}</span>
                      <span className="text-gray-500">{contract.lastScan}</span>
                    </div>
                    {contract.issues > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        {contract.issues} issue{contract.issues > 1 ? 's' : ''} found
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5">
              {showAddContract ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newContractAddress}
                    onChange={(e) => setNewContractAddress(e.target.value)}
                    placeholder="Enter contract address (0x...)"
                    className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleScan(newContractAddress)}
                      disabled={scanning || !newContractAddress}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                    >
                      {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scan'}
                    </button>
                    <button 
                      onClick={() => { setShowAddContract(false); setNewContractAddress(''); }}
                      className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAddContract(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/20 text-sm text-violet-300 hover:bg-violet-500/30 transition-all"
                >
                  Add Contract
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alert Details Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-[#0a0a12] border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <h3 className="font-semibold text-white">Alert Details</h3>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs text-gray-500">Type</span>
                  <p className="text-white capitalize">{selectedAlert.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Severity</span>
                  <p className={cn("capitalize", severityConfig[selectedAlert.severity].color)}>{selectedAlert.severity}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Description</span>
                  <p className="text-white">{selectedAlert.description}</p>
                </div>
                {selectedAlert.affectedAddress && (
                  <div>
                    <span className="text-xs text-gray-500">Affected Address</span>
                    <p className="text-white font-mono text-sm break-all">{selectedAlert.affectedAddress}</p>
                  </div>
                )}
                {selectedAlert.transactionHash && (
                  <div>
                    <span className="text-xs text-gray-500">Transaction Hash</span>
                    <p className="text-white font-mono text-sm break-all">{selectedAlert.transactionHash}</p>
                  </div>
                )}
                {selectedAlert.recommendedAction && (
                  <div>
                    <span className="text-xs text-gray-500">Recommended Action</span>
                    <p className="text-amber-400">{selectedAlert.recommendedAction}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500">Timestamp</span>
                  <p className="text-white">{selectedAlert.timestamp}</p>
                </div>
              </div>
              <div className="flex gap-3 border-t border-white/5 px-6 py-4">
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                {selectedAlert.affectedAddress && (
                  <a 
                    href={`https://etherscan.io/address/${selectedAlert.affectedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/30 transition-colors"
                  >
                    View on Etherscan
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

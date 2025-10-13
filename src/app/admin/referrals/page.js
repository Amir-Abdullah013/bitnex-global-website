'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  ToggleLeft, 
  ToggleRight,
  Edit3,
  Save,
  X,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AdminReferralsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    isEnabled: true,
    commissionRates: {
      level1: 10,
      level2: 5,
      level3: 2,
      level4: 1
    }
  });
  const [topReferrers, setTopReferrers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [editingSettings, setEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    activeReferrers: 0,
    totalTransactions: 0
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [settingsRes, topReferrersRes, transactionsRes, statsRes] = await Promise.all([
        fetch('/api/admin/referrals/settings'),
        fetch('/api/admin/referrals/top'),
        fetch('/api/admin/referrals/transactions'),
        fetch('/api/admin/referrals/stats')
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings);
        setTempSettings(settingsData.settings);
      }

      if (topReferrersRes.ok) {
        const topData = await topReferrersRes.json();
        setTopReferrers(topData.referrers);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/referrals/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempSettings)
      });

      if (response.ok) {
        setSettings(tempSettings);
        setEditingSettings(false);
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setTempSettings(settings);
    setEditingSettings(false);
  };

  const handleCommissionChange = (level, value) => {
    setTempSettings(prev => ({
      ...prev,
      commissionRates: {
        ...prev.commissionRates,
        [level]: parseFloat(value) || 0
      }
    }));
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.fromUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.toUserName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter === 'all') return matchesSearch;
    
    const transactionDate = new Date(transaction.createdAt);
    const now = new Date();
    const daysAgo = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
    const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return matchesSearch && transactionDate >= filterDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCD535]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white">
      {/* Header */}
      <div className="bg-[#1E2329] border-b border-[#2B3139]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Referral Management</h1>
              <p className="text-gray-400 mt-2">Manage referral program settings and monitor performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 bg-[#2B3139] text-white px-4 py-2 rounded-lg hover:bg-[#3A4049] transition-colors"
              >
                <RefreshCw size={20} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {/* Export functionality */}}
                className="flex items-center space-x-2 bg-[#FCD535] text-black px-4 py-2 rounded-lg hover:bg-[#F0B90B] transition-colors"
              >
                <Download size={20} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X size={20} />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-green-500 bg-opacity-10 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-green-400 hover:text-green-300">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-[#1E2329] p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'top-referrers', label: 'Top Referrers', icon: TrendingUp },
              { id: 'transactions', label: 'Transactions', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#FCD535] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Total Referrals', value: stats.totalReferrals, icon: Users, color: '#FCD535' },
                { title: 'Total Earnings', value: `$${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: '#0ECB81' },
                { title: 'Active Referrers', value: stats.activeReferrers, icon: TrendingUp, color: '#3861FB' },
                { title: 'Total Transactions', value: stats.totalTransactions, icon: BarChart3, color: '#F6465D' }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                        <Icon className="text-white" size={24} style={{ color: stat.color }} />
                      </div>
                      <span className="text-2xl font-bold text-white">{stat.value}</span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">{stat.title}</h3>
                    <p className="text-gray-400 text-sm">All time</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Commission Structure */}
            <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
              <h3 className="text-xl font-semibold text-white mb-4">Current Commission Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(settings.commissionRates).map(([level, rate]) => (
                  <div key={level} className="bg-[#0B0E11] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-[#FCD535] mb-2">
                      {rate}%
                    </div>
                    <div className="text-white font-medium mb-1">
                      Level {level.replace('level', '')}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {level === 'level1' ? 'Direct referrals' :
                       level === 'level2' ? 'Second level' :
                       level === 'level3' ? 'Third level' : 'Fourth level'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Referral Settings</h3>
              {!editingSettings ? (
                <button
                  onClick={() => setEditingSettings(true)}
                  className="flex items-center space-x-2 bg-[#FCD535] text-black px-4 py-2 rounded-lg hover:bg-[#F0B90B] transition-colors"
                >
                  <Edit3 size={18} />
                  <span>Edit Settings</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-[#0ECB81] text-white px-4 py-2 rounded-lg hover:bg-[#0ECB81]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 bg-[#F6465D] text-white px-4 py-2 rounded-lg hover:bg-[#F6465D]/80 transition-colors"
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Global Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-lg">
                <div>
                  <h4 className="text-white font-semibold">Referral Program Status</h4>
                  <p className="text-gray-400 text-sm">Enable or disable the referral program globally</p>
                </div>
                <button
                  onClick={() => setTempSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    tempSettings.isEnabled 
                      ? 'bg-[#0ECB81] text-white' 
                      : 'bg-[#F6465D] text-white'
                  }`}
                >
                  {tempSettings.isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  <span>{tempSettings.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>

            {/* Commission Rates */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Commission Rates (%)</h4>
              {Object.entries(tempSettings.commissionRates).map(([level, rate]) => (
                <div key={level} className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-lg">
                  <div>
                    <span className="text-white font-medium">
                      Level {level.replace('level', '')} 
                      {level === 'level1' ? ' (Direct referrals)' :
                       level === 'level2' ? ' (Second level)' :
                       level === 'level3' ? ' (Third level)' : ' (Fourth level)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) => handleCommissionChange(level, e.target.value)}
                      disabled={!editingSettings}
                      className="w-20 px-3 py-2 bg-[#2B3139] border border-[#3A4049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCD535] disabled:opacity-50"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Referrers Tab */}
        {activeTab === 'top-referrers' && (
          <div className="bg-[#1E2329] rounded-xl border border-[#2B3139]">
            <div className="p-6 border-b border-[#2B3139]">
              <h3 className="text-xl font-semibold text-white">Top Referrers</h3>
              <p className="text-gray-400 mt-1">Users with highest referral earnings</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B0E11]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Total Referrals</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Total Earnings</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Level</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {topReferrers.map((referrer, index) => (
                    <tr key={referrer.id} className="hover:bg-[#0B0E11] transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCD535] text-black">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{referrer.name}</div>
                          <div className="text-gray-400 text-sm">{referrer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{referrer.totalReferrals}</td>
                      <td className="px-6 py-4">
                        <span className="text-[#FCD535] font-medium">
                          ${referrer.totalEarnings.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2B3139] text-white">
                          Level {referrer.referralLevel || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 bg-opacity-10 text-green-400">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-[#1E2329] rounded-xl p-6 border border-[#2B3139]">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#0B0E11] border border-[#2B3139] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCD535]"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter size={18} className="text-gray-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 bg-[#0B0E11] border border-[#2B3139] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FCD535]"
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#1E2329] rounded-xl border border-[#2B3139]">
              <div className="p-6 border-b border-[#2B3139]">
                <h3 className="text-xl font-semibold text-white">Referral Transactions</h3>
                <p className="text-gray-400 mt-1">All referral reward transactions</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0B0E11]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">From User</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">To User</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Level</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B3139]">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-[#0B0E11] transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{transaction.fromUserName || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{transaction.toUserName || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#FCD535] font-medium">
                            ${transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2B3139] text-white">
                            Level {transaction.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

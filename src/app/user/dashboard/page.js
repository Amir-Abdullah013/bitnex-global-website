'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../../lib/auth-context';
import { useUniversal } from '../../../lib/universal-context';
import Layout from '../../../components/Layout';
import ReferralSummary from '../../../components/ReferralSummary';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Activity,
  DollarSign,
  Bitcoin,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    usdBalance, 
    bnxBalance, 
    bnxPrice,
    formatCurrency,
    formatBnx
  } = useUniversal();

  const [showBalance, setShowBalance] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    wallet: { usdBalance: 0, bnxBalance: 0, bnxPrice: 0 },
    market: { price: 0, change24h: 0, volume24h: 0 },
    transactions: [],
    portfolio: { totalValue: 0, totalInvested: 0, totalProfit: 0, profitPercentage: 0 }
  });

  // Calculate total portfolio value
  const totalPortfolioValue = dashboardData.wallet.usdBalance + (dashboardData.wallet.bnxBalance * dashboardData.wallet.bnxPrice);
  const bnxValueInUsd = dashboardData.wallet.bnxBalance * dashboardData.wallet.bnxPrice;

  // Fetch real data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = user?.id || localStorage.getItem('userId') || 'demo-user-123';
      
      // Fetch all data in parallel
      const [walletResponse, marketResponse, transactionsResponse, portfolioResponse] = await Promise.allSettled([
        fetch(`/api/wallet/balance?userId=${userId}`),
        fetch('/api/price?symbol=BNX'),
        fetch(`/api/user/transactions?limit=5&userId=${userId}`),
        fetch('/api/portfolio')
      ]);

      const newData = { ...dashboardData };

      // Process wallet data
      if (walletResponse.status === 'fulfilled' && walletResponse.value.ok) {
        const walletData = await walletResponse.value.json();
        if (walletData.success) {
          newData.wallet = {
            usdBalance: walletData.usdBalance || 0,
            bnxBalance: walletData.bnxBalance || 0,
            bnxPrice: walletData.bnxPrice || 0
          };
        }
      }

      // Process market data
      if (marketResponse.status === 'fulfilled' && marketResponse.value.ok) {
        const marketData = await marketResponse.value.json();
        if (marketData.success) {
          newData.market = {
            price: marketData.price || 0,
            change24h: marketData.change24h || 0,
            volume24h: marketData.volume24h || 0
          };
        }
      }

      // Process transactions data
      if (transactionsResponse.status === 'fulfilled' && transactionsResponse.value.ok) {
        const transactionsData = await transactionsResponse.value.json();
        if (transactionsData.success) {
          newData.transactions = transactionsData.transactions || [];
        }
      }

      // Process portfolio data
      if (portfolioResponse.status === 'fulfilled' && portfolioResponse.value.ok) {
        const portfolioData = await portfolioResponse.value.json();
        if (portfolioData.success && portfolioData.portfolio) {
          newData.portfolio = {
            totalValue: portfolioData.portfolio.totalValue || 0,
            totalInvested: portfolioData.portfolio.totalInvested || 0,
            totalProfit: portfolioData.portfolio.totalProfit || 0,
            profitPercentage: portfolioData.portfolio.profitPercentage || 0
          };
        }
      }

      setDashboardData(newData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Market stats based on real data
  const marketStats = {
    '24h': { 
      change: `+${dashboardData.market.change24h.toFixed(2)}`, 
      percentage: `${dashboardData.market.change24h >= 0 ? '+' : ''}${dashboardData.market.change24h.toFixed(2)}%`, 
      trend: dashboardData.market.change24h >= 0 ? 'up' : 'down' 
    },
    '7d': { 
      change: '+12.45', 
      percentage: '+5.67%', 
      trend: 'up' 
    },
    '30d': { 
      change: '-3.21', 
      percentage: '-1.23%', 
      trend: 'down' 
    }
  };

  const currentStats = marketStats[timeframe];

  // Show loading state
  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-[#181A20] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B]"></div>
                <p className="text-[#848E9C]">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-[#181A20] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="mx-auto text-[#F6465D] mb-4" size={48} />
                <h2 className="text-xl font-semibold text-[#EAECEF] mb-2">Error Loading Dashboard</h2>
                <p className="text-[#848E9C] mb-4">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="px-6 py-3 bg-[#F0B90B] hover:bg-[#F8D12F] text-[#0B0E11] font-semibold rounded-lg transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-[#181A20] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#EAECEF]">
                Welcome back, {user?.name || 'Trader'}! 👋
              </h1>
              <p className="text-[#848E9C] mt-1">Here's what's happening with your portfolio today</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="p-2 hover:bg-[#1E2329] rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`text-[#848E9C] ${loading ? 'animate-spin' : ''}`} size={20} />
              </button>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-[#1E2329] rounded-lg transition-colors"
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? (
                  <Eye className="text-[#848E9C]" size={20} />
                ) : (
                  <EyeOff className="text-[#848E9C]" size={20} />
                )}
              </button>
            </div>
          </motion.div>

          {/* Portfolio Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] rounded-2xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#1E2329] text-sm font-medium">Total Portfolio Value</span>
              <div className="flex items-center space-x-2">
                {currentStats.trend === 'up' ? (
                  <TrendingUp className="text-[#0ECB81]" size={20} />
                ) : (
                  <TrendingDown className="text-[#F6465D]" size={20} />
                )}
                <span className={`text-sm font-semibold ${currentStats.trend === 'up' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                  {currentStats.percentage}
                </span>
              </div>
            </div>
            
            <div className="mb-2">
              {showBalance ? (
                <h2 className="text-4xl sm:text-5xl font-bold text-[#1E2329]">
                  ${totalPortfolioValue.toFixed(2)}
                </h2>
              ) : (
                <h2 className="text-4xl sm:text-5xl font-bold text-[#1E2329]">••••••</h2>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-[#1E2329]">
              <span className="text-sm">≈ {formatBnx(totalPortfolioValue / dashboardData.wallet.bnxPrice)} BNX</span>
              <span className="text-xs opacity-70">at ${dashboardData.wallet.bnxPrice.toFixed(2)}/BNX</span>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'USD Balance',
                value: showBalance ? formatCurrency(dashboardData.wallet.usdBalance, 'USD') : '••••',
                change: '+0.00%',
                icon: DollarSign,
                color: '#0ECB81',
                bgColor: '#0ECB8115'
              },
              {
                title: 'BNX Balance',
                value: showBalance ? `${formatBnx(dashboardData.wallet.bnxBalance)}` : '••••',
                change: currentStats.percentage,
                icon: Bitcoin,
                color: '#F0B90B',
                bgColor: '#F0B90B15'
              },
              {
                title: 'BNX Value (USD)',
                value: showBalance ? formatCurrency(bnxValueInUsd, 'USD') : '••••',
                change: currentStats.percentage,
                icon: Wallet,
                color: '#3861FB',
                bgColor: '#3861FB15'
              },
              {
                title: 'Today\'s PnL',
                value: showBalance ? `$${dashboardData.portfolio.totalProfit.toFixed(2)}` : '••••',
                change: `${dashboardData.portfolio.profitPercentage >= 0 ? '+' : ''}${dashboardData.portfolio.profitPercentage.toFixed(2)}%`,
                icon: Activity,
                color: dashboardData.portfolio.totalProfit >= 0 ? '#0ECB81' : '#F6465D',
                bgColor: dashboardData.portfolio.totalProfit >= 0 ? '#0ECB8115' : '#F6465D15'
              }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-[#1E2329] rounded-xl p-5 border border-[#2B313980] hover:border-[#F0B90B]/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: stat.bgColor }}
                    >
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-[#848E9C] text-xs mb-1">{stat.title}</h3>
                  <p className="text-[#EAECEF] text-xl font-bold">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Referral Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ReferralSummary userId={user?.id} />
          </motion.div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#1E2329] rounded-xl border border-[#2B313980] p-6"
            >
              <h3 className="text-[#EAECEF] text-lg font-semibold mb-4 flex items-center">
                <Activity className="mr-2 text-[#F0B90B]" size={20} />
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Buy BNX', icon: ArrowUpRight, color: '#0ECB81', href: '/user/trade' },
                  { label: 'Sell BNX', icon: ArrowDownRight, color: '#F6465D', href: '/user/trade' },
                  { label: 'Deposit Funds', icon: DollarSign, color: '#3861FB', href: '/user/deposit' },
                  { label: 'Withdraw', icon: Wallet, color: '#F0B90B', href: '/user/withdraw' },
                  { label: 'View Markets', icon: BarChart3, color: '#848E9C', href: '/user/markets' }
                ].map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(action.href)}
                      className="w-full flex items-center justify-between p-3 bg-[#181A20] rounded-lg hover:bg-[#2B3139] transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${action.color}15` }}
                        >
                          <ActionIcon size={18} style={{ color: action.color }} />
                        </div>
                        <span className="text-[#EAECEF] text-sm font-medium">{action.label}</span>
                      </div>
                      <ArrowUpRight size={16} className="text-[#848E9C] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-2 bg-[#1E2329] rounded-xl border border-[#2B313980] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#EAECEF] text-lg font-semibold flex items-center">
                  <Clock className="mr-2 text-[#F0B90B]" size={20} />
                  Recent Activity
                </h3>
                <button 
                  onClick={() => router.push('/user/transactions')}
                  className="text-[#F0B90B] text-sm hover:text-[#F8D12F] transition-colors"
                >
                  View All →
                </button>
              </div>
              
              <div className="space-y-3">
                {dashboardData.transactions.length > 0 ? (
                  dashboardData.transactions.map((transaction, index) => {
                    const isPositive = transaction.type === 'buy' || transaction.type === 'deposit';
                    const Icon = transaction.type === 'deposit' ? ArrowDownRight : 
                                 transaction.type === 'buy' ? ArrowUpRight : ArrowDownRight;
                    
                    // Format time
                    const timeAgo = new Date(transaction.createdAt);
                    const now = new Date();
                    const diffInHours = Math.floor((now - timeAgo) / (1000 * 60 * 60));
                    const timeString = diffInHours < 1 ? 'Just now' : 
                                     diffInHours < 24 ? `${diffInHours}h ago` : 
                                     `${Math.floor(diffInHours / 24)}d ago`;
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-[#181A20] rounded-lg hover:bg-[#2B3139] transition-all group"
                      >
                        <div className="flex items-center space-x-4">
                          <div 
                            className={`p-2 rounded-lg ${isPositive ? 'bg-[#0ECB81]15' : 'bg-[#F6465D]15'}`}
                          >
                            <Icon 
                              size={20} 
                              className={isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'} 
                            />
                          </div>
                          <div>
                            <p className="text-[#EAECEF] font-medium capitalize">
                              {transaction.type} {transaction.currency || 'USD'}
                            </p>
                            <p className="text-[#848E9C] text-sm">{timeString}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-semibold ${isPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                            {isPositive ? '+' : '-'}${transaction.amount?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-[#848E9C] text-sm">
                            {transaction.status === 'completed' ? '✓ Completed' : 
                             transaction.status === 'pending' ? '⏳ Pending' : 
                             transaction.status === 'failed' ? '✗ Failed' : transaction.status}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto text-[#848E9C] mb-4" size={48} />
                    <p className="text-[#848E9C]">No recent transactions</p>
                    <p className="text-[#848E9C] text-sm">Your transaction history will appear here</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Market Overview Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-gradient-to-r from-[#1E2329] to-[#2B3139] rounded-xl border border-[#2B313980] p-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-[#EAECEF] text-xl font-bold mb-2">
                  BNX is trending {currentStats.trend === 'up' ? '📈' : '📉'} at ${dashboardData.market.price.toFixed(4)}
                </h3>
                <p className="text-[#848E9C]">
                  Market is {currentStats.trend === 'up' ? 'bullish' : 'bearish'}. {currentStats.percentage} in the last {timeframe}
                  {dashboardData.market.volume24h > 0 && (
                    <span className="block text-sm mt-1">
                      Volume: ${dashboardData.market.volume24h.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/user/markets')}
                  className="px-6 py-3 bg-[#F0B90B] hover:bg-[#F8D12F] text-[#0B0E11] font-semibold rounded-lg transition-all"
                >
                  View Markets
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/user/trade')}
                  className="px-6 py-3 bg-transparent border-2 border-[#F0B90B] text-[#F0B90B] hover:bg-[#F0B90B] hover:text-[#0B0E11] font-semibold rounded-lg transition-all"
                >
                  Start Trading
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

/**
 * Enhanced User Dashboard
 * Modern user dashboard with responsive design and smooth animations
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Wallet,
  BarChart3,
  Activity,
  Bell,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Grid, Flex, Stack } from '../design-system/Grid';
import { Heading, Text, Badge } from '../design-system/Typography';
import Button from '../design-system/Button';
import { useTheme } from '../../lib/theme-context';

const EnhancedUserDashboard = () => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  const [portfolio, setPortfolio] = useState({
    totalValue: 12543.67,
    totalChange: 234.56,
    totalChangePercent: 1.91,
    assets: [
      { symbol: 'BNX', balance: 1250.45, value: 6252.25, change: 125.30, changePercent: 2.04 },
      { symbol: 'USDT', balance: 5000.00, value: 5000.00, change: 0, changePercent: 0 },
      { symbol: 'TIKI', balance: 1000.00, value: 1291.42, change: 109.26, changePercent: 9.25 }
    ]
  });

  const [recentTrades, setRecentTrades] = useState([
    {
      id: 1,
      pair: 'BNX/USDT',
      type: 'buy',
      amount: 100.00,
      price: 5.25,
      value: 525.00,
      timestamp: '2 minutes ago',
      status: 'completed'
    },
    {
      id: 2,
      pair: 'TIKI/USDT',
      type: 'sell',
      amount: 50.00,
      price: 1.29,
      value: 64.50,
      timestamp: '15 minutes ago',
      status: 'completed'
    },
    {
      id: 3,
      pair: 'BNX/USDT',
      type: 'buy',
      amount: 200.00,
      price: 5.20,
      value: 1040.00,
      timestamp: '1 hour ago',
      status: 'completed'
    }
  ]);

  const [marketData, setMarketData] = useState([
    { symbol: 'BNX', price: 5.25, change: 0.12, changePercent: 2.34, volume: '2.4M' },
    { symbol: 'TIKI', price: 1.29, change: -0.05, changePercent: -3.73, volume: '1.8M' },
    { symbol: 'BTC', price: 43250.00, change: 1250.00, changePercent: 2.98, volume: '15.2M' }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const timeRanges = [
    { id: '1h', label: '1H' },
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' }
  ];

  const quickActions = [
    { label: 'Buy', icon: TrendingUp, color: 'green', href: '/user/trade' },
    { label: 'Sell', icon: TrendingDown, color: 'red', href: '/user/trade' },
    { label: 'Deposit', icon: ArrowUpRight, color: 'blue', href: '/user/deposit' },
    { label: 'Withdraw', icon: ArrowDownRight, color: 'orange', href: '/user/withdraw' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading size="2xl" className="text-gray-900 dark:text-white">
            Welcome back, John!
          </Heading>
          <Text className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your portfolio overview
          </Text>
        </div>
        
        <Flex className="mt-4 sm:mt-0" gap="md">
          <Button
            variant="outline"
            size="sm"
            icon={showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? 'Hide' : 'Show'} Balances
          </Button>
          <Button variant="primary" size="sm" icon={<Plus size={16} />}>
            New Trade
          </Button>
        </Flex>
      </motion.div>

      {/* Portfolio Overview */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Flex className="justify-between items-center mb-6">
          <Heading size="lg">Portfolio Overview</Heading>
          <Badge 
            variant={portfolio.totalChange >= 0 ? 'success' : 'danger'}
            size="sm"
          >
            {portfolio.totalChange >= 0 ? '+' : ''}{portfolio.totalChangePercent}%
          </Badge>
        </Flex>
        
        <div className="space-y-4">
          <div>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">
              {showBalances ? `$${portfolio.totalValue.toLocaleString()}` : '••••••'}
            </Text>
            <Flex className="items-center mt-1">
              {portfolio.totalChange >= 0 ? (
                <TrendingUp size={16} className="text-green-500 mr-1" />
              ) : (
                <TrendingDown size={16} className="text-red-500 mr-1" />
              )}
              <Text className={`text-sm ${portfolio.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {showBalances ? `$${portfolio.totalChange.toFixed(2)}` : '••••'} today
              </Text>
            </Flex>
          </div>
          
          <Grid cols={3} gap="md">
            {portfolio.assets.map((asset, index) => (
              <motion.div
                key={asset.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <Flex className="justify-between items-center mb-2">
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {asset.symbol}
                  </Text>
                  <Badge 
                    variant={asset.change >= 0 ? 'success' : 'danger'}
                    size="sm"
                  >
                    {asset.change >= 0 ? '+' : ''}{asset.changePercent}%
                  </Badge>
                </Flex>
                
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {showBalances ? `$${asset.value.toLocaleString()}` : '••••••'}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {showBalances ? `${asset.balance.toLocaleString()} ${asset.symbol}` : '••••••'}
                </Text>
              </motion.div>
            ))}
          </Grid>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Heading size="lg" className="mb-4">Quick Actions</Heading>
        <Grid cols={4} gap="md">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.a
                key={action.label}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-12 h-12 bg-${action.color}-100 dark:bg-${action.color}-900 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className={`text-${action.color}-600`} />
                </div>
                <Text className="font-medium text-gray-900 dark:text-white">
                  {action.label}
                </Text>
              </motion.a>
            );
          })}
        </Grid>
      </motion.div>

      {/* Market Data and Recent Trades */}
      <Grid cols={2} gap="lg">
        {/* Market Data */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Flex className="justify-between items-center">
              <Heading size="lg">Market Data</Heading>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Flex>
          </div>
          
          <div className="p-6">
            <Stack spacing="md">
              {marketData.map((market, index) => (
                <motion.div
                  key={market.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {market.symbol}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      Vol: {market.volume}
                    </Text>
                  </div>
                  
                  <div className="text-right">
                    <Text className="font-medium text-gray-900 dark:text-white">
                      ${market.price.toLocaleString()}
                    </Text>
                    <Flex className="items-center justify-end">
                      {market.change >= 0 ? (
                        <TrendingUp size={14} className="text-green-500 mr-1" />
                      ) : (
                        <TrendingDown size={14} className="text-red-500 mr-1" />
                      )}
                      <Text className={`text-sm ${market.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {market.change >= 0 ? '+' : ''}{market.changePercent}%
                      </Text>
                    </Flex>
                  </div>
                </motion.div>
              ))}
            </Stack>
          </div>
        </motion.div>

        {/* Recent Trades */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Flex className="justify-between items-center">
              <Heading size="lg">Recent Trades</Heading>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Flex>
          </div>
          
          <div className="p-6">
            <Stack spacing="md">
              {recentTrades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${trade.type === 'buy' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                      {trade.type === 'buy' ? (
                        <TrendingUp size={16} className="text-green-600" />
                      ) : (
                        <TrendingDown size={16} className="text-red-600" />
                      )}
                    </div>
                    
                    <div>
                      <Text className="font-medium text-gray-900 dark:text-white">
                        {trade.pair}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        {trade.type.toUpperCase()} • {trade.amount} {trade.pair.split('/')[0]}
                      </Text>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Text className="font-medium text-gray-900 dark:text-white">
                      ${trade.value.toLocaleString()}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {trade.timestamp}
                    </Text>
                  </div>
                </motion.div>
              ))}
            </Stack>
          </div>
        </motion.div>
      </Grid>
    </motion.div>
  );
};

export default EnhancedUserDashboard;


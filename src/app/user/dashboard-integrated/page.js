/**
 * Integrated Dashboard with Market Ticker
 * Complete dashboard with live market data and navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import MarketTicker from '../../../components/MarketTicker';
import { Grid, Flex, Stack } from '../../../components/design-system/Grid';
import { Heading, Text, Badge } from '../../../components/design-system/Typography';
import Button from '../../../components/design-system/Button';

const IntegratedDashboard = () => {
  const [showBalances, setShowBalances] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#F0B90B] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E11]">
      {/* Market Ticker */}
      <MarketTicker 
        symbols={['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT']}
        className="sticky top-0 z-40"
      />

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-6 space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading size="2xl" className="text-[#EAECEF]">
              Welcome back, John!
            </Heading>
            <Text className="text-[#B7BDC6] mt-1">
              Here's your portfolio overview with live market data
            </Text>
          </div>
          
          <Flex className="mt-4 sm:mt-0" gap="md">
            <Button
              variant="outline"
              size="sm"
              icon={showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
              onClick={() => setShowBalances(!showBalances)}
              className="border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]"
            >
              {showBalances ? 'Hide' : 'Show'} Balances
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<Plus size={16} />}
              className="bg-[#F0B90B] text-[#0B0E11] hover:bg-[#FCD535]"
            >
              New Trade
            </Button>
          </Flex>
        </motion.div>

        {/* Portfolio Overview */}
        <motion.div 
          variants={itemVariants} 
          className="bg-[#181A20] rounded-xl shadow-sm border border-[#2B3139] p-6"
        >
          <Flex className="justify-between items-center mb-6">
            <Heading size="lg" className="text-[#EAECEF]">Portfolio Overview</Heading>
            <Badge 
              variant={portfolio.totalChange >= 0 ? 'success' : 'danger'}
              size="sm"
              className={portfolio.totalChange >= 0 ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'}
            >
              {portfolio.totalChange >= 0 ? '+' : ''}{portfolio.totalChangePercent}%
            </Badge>
          </Flex>
          
          <div className="space-y-4">
            <div>
              <Text className="text-3xl font-bold text-[#EAECEF]">
                {showBalances ? `$${portfolio.totalValue.toLocaleString()}` : '••••••'}
              </Text>
              <Flex className="items-center mt-1">
                {portfolio.totalChange >= 0 ? (
                  <TrendingUp size={16} className="text-[#0ECB81] mr-1" />
                ) : (
                  <TrendingDown size={16} className="text-[#F6465D] mr-1" />
                )}
                <Text className={`text-sm ${portfolio.totalChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
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
                  className="p-4 bg-[#2B3139] rounded-lg hover:bg-[#3C4043] transition-colors"
                >
                  <Flex className="justify-between items-center mb-2">
                    <Text className="font-medium text-[#EAECEF]">
                      {asset.symbol}
                    </Text>
                    <Badge 
                      variant={asset.change >= 0 ? 'success' : 'danger'}
                      size="sm"
                      className={asset.change >= 0 ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'}
                    >
                      {asset.change >= 0 ? '+' : ''}{asset.changePercent}%
                    </Badge>
                  </Flex>
                  
                  <Text className="text-lg font-bold text-[#EAECEF]">
                    {showBalances ? `$${asset.value.toLocaleString()}` : '••••••'}
                  </Text>
                  <Text className="text-sm text-[#B7BDC6]">
                    {showBalances ? `${asset.balance.toLocaleString()} ${asset.symbol}` : '••••••'}
                  </Text>
                </motion.div>
              ))}
            </Grid>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Heading size="lg" className="mb-4 text-[#EAECEF]">Quick Actions</Heading>
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
                  className="bg-[#181A20] rounded-xl p-6 shadow-sm border border-[#2B3139] hover:shadow-md hover:bg-[#2B3139] transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-12 h-12 bg-${action.color}-100 dark:bg-${action.color}-900 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={`text-${action.color}-600`} />
                  </div>
                  <Text className="font-medium text-[#EAECEF]">
                    {action.label}
                  </Text>
                </motion.a>
              );
            })}
          </Grid>
        </motion.div>

        {/* Recent Trades */}
        <motion.div 
          variants={itemVariants} 
          className="bg-[#181A20] rounded-xl shadow-sm border border-[#2B3139]"
        >
          <div className="p-6 border-b border-[#2B3139]">
            <Flex className="justify-between items-center">
              <Heading size="lg" className="text-[#EAECEF]">Recent Trades</Heading>
              <Button variant="ghost" size="sm" className="text-[#B7BDC6] hover:text-[#EAECEF]">
                View All
              </Button>
            </Flex>
          </div>
          
          <div className="p-6">
            <Stack spacing="md">
              {recentTrades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2B3139] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${trade.type === 'buy' ? 'bg-[#0ECB81]/20' : 'bg-[#F6465D]/20'}`}>
                      {trade.type === 'buy' ? (
                        <TrendingUp size={16} className="text-[#0ECB81]" />
                      ) : (
                        <TrendingDown size={16} className="text-[#F6465D]" />
                      )}
                    </div>
                    
                    <div>
                      <Text className="font-medium text-[#EAECEF]">
                        {trade.pair}
                      </Text>
                      <Text className="text-sm text-[#B7BDC6]">
                        {trade.type.toUpperCase()} • {trade.amount} {trade.pair.split('/')[0]}
                      </Text>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Text className="font-medium text-[#EAECEF]">
                      ${trade.value.toLocaleString()}
                    </Text>
                    <Text className="text-sm text-[#B7BDC6]">
                      {trade.timestamp}
                    </Text>
                  </div>
                </motion.div>
              ))}
            </Stack>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default IntegratedDashboard;

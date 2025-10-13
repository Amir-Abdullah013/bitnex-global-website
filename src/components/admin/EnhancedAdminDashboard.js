/**
 * Enhanced Admin Dashboard
 * Modern admin dashboard with responsive design and smooth animations
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Grid, Flex, Stack } from '../design-system/Grid';
import { Heading, Text, Badge } from '../design-system/Typography';
import Button from '../design-system/Button';
import { useTheme } from '../../lib/theme-context';

const EnhancedAdminDashboard = () => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [stats, setStats] = useState({
    totalUsers: 12543,
    totalVolume: 2847392.45,
    activeTrades: 1247,
    pendingDeposits: 23,
    systemHealth: 98.5,
    alerts: 3
  });

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const timeRanges = [
    { id: '1h', label: '1H' },
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' }
  ];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Trading Volume',
      value: `$${stats.totalVolume.toLocaleString()}`,
      change: '+8.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Active Trades',
      value: stats.activeTrades.toLocaleString(),
      change: '-2.1%',
      trend: 'down',
      icon: Activity,
      color: 'purple'
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth}%`,
      change: '+0.3%',
      trend: 'up',
      icon: Shield,
      color: 'green'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      user: 'John Doe',
      action: 'Registered new account',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'large_trade',
      user: 'Jane Smith',
      action: 'Executed large trade ($50,000)',
      timestamp: '5 minutes ago',
      status: 'warning'
    },
    {
      id: 3,
      type: 'deposit',
      user: 'Mike Johnson',
      action: 'Deposited $10,000',
      timestamp: '8 minutes ago',
      status: 'success'
    },
    {
      id: 4,
      type: 'withdrawal',
      user: 'Sarah Wilson',
      action: 'Withdrawal request pending',
      timestamp: '12 minutes ago',
      status: 'pending'
    }
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'High CPU Usage',
      message: 'Server CPU usage is above 80%',
      timestamp: '5 minutes ago'
    },
    {
      id: 2,
      type: 'error',
      title: 'Database Connection',
      message: 'Database connection timeout detected',
      timestamp: '15 minutes ago'
    },
    {
      id: 3,
      type: 'info',
      title: 'Maintenance Scheduled',
      message: 'System maintenance scheduled for tonight',
      timestamp: '1 hour ago'
    }
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
            Admin Dashboard
          </Heading>
          <Text className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your trading platform
          </Text>
        </div>
        
        <Flex className="mt-4 sm:mt-0" gap="md">
          <Button variant="outline" size="sm" icon={<RefreshCw size={16} />}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" icon={<Download size={16} />}>
            Export
          </Button>
          <Button variant="primary" size="sm" icon={<Settings size={16} />}>
            Settings
          </Button>
        </Flex>
      </motion.div>

      {/* Time Range Selector */}
      <motion.div variants={itemVariants} className="flex items-center space-x-2">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Time Range:
        </Text>
        <Flex gap="sm">
          {timeRanges.map((range) => (
            <motion.button
              key={range.id}
              onClick={() => setSelectedTimeRange(range.id)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${selectedTimeRange === range.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {range.label}
            </motion.button>
          ))}
        </Flex>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <Grid cols={4} gap="md">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
            
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <Flex className="justify-between items-start mb-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon size={20} className={`text-${card.color}-600`} />
                  </div>
                  <Badge 
                    variant={card.trend === 'up' ? 'success' : 'danger'}
                    size="sm"
                  >
                    <TrendIcon size={12} className="mr-1" />
                    {card.change}
                  </Badge>
                </Flex>
                
                <div>
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {card.title}
                  </Text>
                </div>
              </motion.div>
            );
          })}
        </Grid>
      </motion.div>

      {/* Charts and Tables */}
      <Grid cols={2} gap="lg">
        {/* Recent Activities */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Flex className="justify-between items-center">
              <Heading size="lg">Recent Activities</Heading>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Flex>
          </div>
          
          <div className="p-6">
            <Stack spacing="md">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`
                    p-2 rounded-full
                    ${activity.status === 'success' ? 'bg-green-100 dark:bg-green-900' : ''}
                    ${activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' : ''}
                    ${activity.status === 'pending' ? 'bg-blue-100 dark:bg-blue-900' : ''}
                  `}>
                    {activity.status === 'success' && <CheckCircle size={16} className="text-green-600" />}
                    {activity.status === 'warning' && <AlertTriangle size={16} className="text-yellow-600" />}
                    {activity.status === 'pending' && <Clock size={16} className="text-blue-600" />}
                  </div>
                  
                  <div className="flex-1">
                    <Text className="font-medium text-gray-900 dark:text-white">
                      {activity.user}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.action}
                    </Text>
                  </div>
                  
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.timestamp}
                  </Text>
                </motion.div>
              ))}
            </Stack>
          </div>
        </motion.div>

        {/* System Alerts */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Flex className="justify-between items-center">
              <Heading size="lg">System Alerts</Heading>
              <Badge variant="danger" size="sm">
                {stats.alerts} Active
              </Badge>
            </Flex>
          </div>
          
          <div className="p-6">
            <Stack spacing="md">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 rounded-lg border-l-4
                    ${alert.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                    ${alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}
                    ${alert.type === 'info' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {alert.title}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {alert.message}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {alert.timestamp}
                  </Text>
                </motion.div>
              ))}
            </Stack>
          </div>
        </motion.div>
      </Grid>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Heading size="lg" className="mb-4">Quick Actions</Heading>
        <Grid cols={4} gap="md">
          <Button variant="outline" className="h-20 flex-col">
            <Users size={24} className="mb-2" />
            <Text size="sm">Manage Users</Text>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <BarChart3 size={24} className="mb-2" />
            <Text size="sm">View Reports</Text>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <Settings size={24} className="mb-2" />
            <Text size="sm">System Settings</Text>
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <Bell size={24} className="mb-2" />
            <Text size="sm">Notifications</Text>
          </Button>
        </Grid>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedAdminDashboard;




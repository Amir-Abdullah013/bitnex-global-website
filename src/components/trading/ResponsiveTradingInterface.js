/**
 * Responsive Trading Interface
 * Mobile-friendly trading interface with modern design
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Settings,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import Button from '../design-system/Button';
import Input from '../design-system/Input';
import { useTheme } from '../../lib/theme-context';

const ResponsiveTradingInterface = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  const tabs = [
    { id: 'buy', label: 'Buy', icon: TrendingUp, color: 'text-green-500' },
    { id: 'sell', label: 'Sell', icon: TrendingDown, color: 'text-red-500' }
  ];

  const orderTypes = [
    { id: 'market', label: 'Market' },
    { id: 'limit', label: 'Limit' },
    { id: 'stop', label: 'Stop' }
  ];

  const quickAmounts = ['25%', '50%', '75%', '100%'];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-4xl mx-auto p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Trading Interface
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trade BNX/USDT • {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} View
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
            <Monitor size={14} />
            <span>Desktop</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
            <Tablet size={14} />
            <span>Tablet</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-blue-500">
            <Smartphone size={14} />
            <span>Mobile</span>
          </div>
        </div>
      </div>

      {/* Main Trading Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-4 px-6
                  transition-colors duration-200
                  ${activeTab === tab.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={20} className={activeTab === tab.id ? tab.color : ''} />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Trading Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={tabVariants}
            className="p-6"
          >
            {/* Order Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Order Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {orderTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    onClick={() => setOrderType(type.id)}
                    className={`
                      py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200
                      ${orderType === type.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {type.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                helperText="Enter the amount you want to trade"
              />
              
              {/* Quick Amount Buttons */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Quick Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((percentage) => (
                    <motion.button
                      key={percentage}
                      className="py-2 px-3 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {percentage}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Input (for limit orders) */}
            {orderType === 'limit' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Input
                  label="Price"
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  helperText="Enter your desired price"
                />
              </motion.div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <span className="font-medium capitalize">{orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Side:</span>
                  <span className={`font-medium ${activeTab === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                    {activeTab.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                  <span className="font-medium">{amount || '0.00'} BNX</span>
                </div>
                {orderType === 'limit' && price && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Price:</span>
                    <span className="font-medium">${price} USDT</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant={activeTab === 'buy' ? 'success' : 'danger'}
                size="lg"
                className="flex-1"
                disabled={!amount || (orderType === 'limit' && !price)}
              >
                {activeTab === 'buy' ? 'Buy BNX' : 'Sell BNX'}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="sm:w-auto"
                icon={<Settings size={16} />}
              >
                Settings
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile-specific features */}
      {deviceType === 'mobile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
            <Smartphone size={16} />
            <span>Optimized for mobile trading</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResponsiveTradingInterface;




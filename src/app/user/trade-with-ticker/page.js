/**
 * Enhanced Trading Page with Market Ticker
 * Trading interface with real-time market ticker integration
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
  Tablet,
  DollarSign,
  Percent,
  Clock
} from 'lucide-react';
import MarketTicker from '../../../components/MarketTicker';
import Button from '../../../components/design-system/Button';
import Input from '../../../components/design-system/Input';

const TradeWithTicker = () => {
  const [activeTab, setActiveTab] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [deviceType, setDeviceType] = useState('desktop');
  const [isLoading, setIsLoading] = useState(false);

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
    { id: 'buy', label: 'Buy', icon: TrendingUp, color: 'text-[#0ECB81]' },
    { id: 'sell', label: 'Sell', icon: TrendingDown, color: 'text-[#F6465D]' }
  ];

  const orderTypes = [
    { id: 'market', label: 'Market' },
    { id: 'limit', label: 'Limit' },
    { id: 'stop', label: 'Stop' }
  ];

  const quickAmounts = ['25%', '50%', '75%', '100%'];

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

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
    <div className="min-h-screen bg-[#181A20]">
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
        className="p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#F0B90B]/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-[#F0B90B]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#EAECEF]">
                Trading Interface
              </h1>
              <p className="text-sm text-[#B7BDC6]">
                Trade with live market data • {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} View
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1 text-xs text-[#848E9C]">
              <Monitor size={14} />
              <span>Desktop</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1 text-xs text-[#848E9C]">
              <Tablet size={14} />
              <span>Tablet</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-[#F0B90B]">
              <Smartphone size={14} />
              <span>Mobile</span>
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="bg-[#1E2329] rounded-xl shadow-lg border border-[#2B3139] overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#2B3139]">
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
                      ? 'bg-[#F0B90B]/20 text-[#F0B90B] border-b-2 border-[#F0B90B]' 
                      : 'text-[#B7BDC6] hover:text-[#EAECEF]'
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
                <label className="block text-sm font-medium text-[#EAECEF] mb-3">
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
                          ? 'bg-[#F0B90B] text-[#181A20] shadow-md'
                          : 'bg-[#2B3139] text-[#EAECEF] hover:bg-[#3C4043]'
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
                  className="bg-[#2B3139] border-[#3C4043] text-[#EAECEF] focus:border-[#F0B90B]"
                />
                
                {/* Quick Amount Buttons */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-[#B7BDC6] mb-2">
                    Quick Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((percentage) => (
                      <motion.button
                        key={percentage}
                        className="py-2 px-3 text-xs font-medium bg-[#2B3139] text-[#EAECEF] rounded-lg hover:bg-[#3C4043] transition-colors"
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
                    className="bg-[#2B3139] border-[#3C4043] text-[#EAECEF] focus:border-[#F0B90B]"
                  />
                </motion.div>
              )}

              {/* Order Summary */}
              <div className="bg-[#2B3139] rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-[#EAECEF] mb-3">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#B7BDC6]">Type:</span>
                    <span className="font-medium text-[#EAECEF] capitalize">{orderType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B7BDC6]">Side:</span>
                    <span className={`font-medium ${activeTab === 'buy' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {activeTab.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#B7BDC6]">Amount:</span>
                    <span className="font-medium text-[#EAECEF]">{amount || '0.00'} BNX</span>
                  </div>
                  {orderType === 'limit' && price && (
                    <div className="flex justify-between">
                      <span className="text-[#B7BDC6]">Price:</span>
                      <span className="font-medium text-[#EAECEF]">${price} USDT</span>
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
                  loading={isLoading}
                  onClick={handleSubmit}
                >
                  {activeTab === 'buy' ? 'Buy BNX' : 'Sell BNX'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="sm:w-auto border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]"
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
            className="mt-4 p-4 bg-[#F0B90B]/10 rounded-lg border border-[#F0B90B]/20"
          >
            <div className="flex items-center space-x-2 text-sm text-[#F0B90B]">
              <Smartphone size={16} />
              <span>Optimized for mobile trading with live market data</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TradeWithTicker;

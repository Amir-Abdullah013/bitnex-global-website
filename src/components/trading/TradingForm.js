/**
 * Trading Form Component
 * Buy/Sell form with order types and validation
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Clock,
  Settings,
  Calculator,
  AlertCircle
} from 'lucide-react';
import Button from '../design-system/Button';
import BinanceInput from '../design-system/BinanceInput';

const TradingForm = ({ 
  symbol = 'BTCUSDT',
  currentPrice = 0,
  onTrade,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'buy', label: 'Buy', icon: TrendingUp, color: 'text-[#0ECB81]' },
    { id: 'sell', label: 'Sell', icon: TrendingDown, color: 'text-[#F6465D]' }
  ];

  const orderTypes = [
    { id: 'market', label: 'Market', description: 'Execute immediately at current market price' },
    { id: 'limit', label: 'Limit', description: 'Set your desired price' },
    { id: 'stop', label: 'Stop', description: 'Trigger when price reaches stop price' }
  ];

  const quickAmounts = ['25%', '50%', '75%', '100%'];

  // Calculate total value
  useEffect(() => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = parseFloat(price) || currentPrice;
    setTotal(amountNum * priceNum);
  }, [amount, price, currentPrice]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (orderType === 'stop' && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      newErrors.stopPrice = 'Stop price must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const tradeData = {
        symbol,
        side: activeTab.toUpperCase(),
        type: orderType.toUpperCase(),
        amount: parseFloat(amount),
        price: orderType === 'market' ? currentPrice : parseFloat(price),
        stopPrice: orderType === 'stop' ? parseFloat(stopPrice) : undefined,
        total
      };
      
      await onTrade(tradeData);
      
      // Reset form
      setAmount('');
      setPrice('');
      setStopPrice('');
      setTotal(0);
      setErrors({});
    } catch (error) {
      console.error('Trade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick amount selection
  const handleQuickAmount = (percentage) => {
    const percent = parseFloat(percentage) / 100;
    const maxAmount = activeTab === 'buy' ? 10000 / currentPrice : 1000; // Example max amounts
    const calculatedAmount = maxAmount * percent;
    setAmount(calculatedAmount.toFixed(8));
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 4 
      });
    } else {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 8 
      });
    }
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`
        bg-[#1E2329] rounded-lg border border-[#2B3139]
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2B3139]">
        <div className="flex items-center space-x-2">
          <Calculator size={20} className="text-[#F0B90B]" />
          <span className="text-lg font-semibold text-[#EAECEF]">
            {symbol.replace('USDT', '/USDT')}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-[#B7BDC6]">Current Price</div>
          <div className="text-lg font-bold text-[#EAECEF]">
            ${formatPrice(currentPrice)}
          </div>
        </div>
      </div>

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
          className="p-4"
        >
          {/* Order Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#EAECEF] mb-2">
              Order Type
            </label>
            <div className="space-y-2">
              {orderTypes.map((type) => (
                <motion.button
                  key={type.id}
                  onClick={() => setOrderType(type.id)}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors
                    ${orderType === type.id
                      ? 'bg-[#F0B90B] text-[#181A20]'
                      : 'bg-[#2B3139] text-[#EAECEF] hover:bg-[#3C4043]'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-75">{type.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <BinanceInput
              label="Amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              helperText="Enter the amount you want to trade"
            />
            
            {/* Quick Amount Buttons */}
            <div className="mt-2">
              <label className="block text-xs font-medium text-[#B7BDC6] mb-1">
                Quick Amount
              </label>
              <div className="grid grid-cols-4 gap-1">
                {quickAmounts.map((percentage) => (
                  <motion.button
                    key={percentage}
                    onClick={() => handleQuickAmount(percentage)}
                    className="py-1.5 px-2 text-xs font-medium bg-[#2B3139] text-[#EAECEF] rounded hover:bg-[#3C4043] transition-colors"
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
              className="mb-4"
            >
              <BinanceInput
                label="Price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={errors.price}
                helperText="Enter your desired price"
              />
            </motion.div>
          )}

          {/* Stop Price Input (for stop orders) */}
          {orderType === 'stop' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <BinanceInput
                label="Stop Price"
                type="number"
                placeholder="0.00"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                error={errors.stopPrice}
                helperText="Enter the stop price"
              />
            </motion.div>
          )}

          {/* Total Display */}
          {total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-[#2B3139] rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#B7BDC6]">Total</span>
                <span className="text-lg font-bold text-[#EAECEF]">
                  ${formatPrice(total)}
                </span>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <Button
            variant={activeTab === 'buy' ? 'success' : 'danger'}
            size="lg"
            className="w-full"
            disabled={!amount || (orderType === 'limit' && !price) || (orderType === 'stop' && !stopPrice)}
            loading={isLoading}
            onClick={handleSubmit}
          >
            {activeTab === 'buy' ? 'Buy' : 'Sell'} {symbol.replace('USDT', '')}
          </Button>

          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-[#F6465D]/10 border border-[#F6465D]/20 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-sm text-[#F6465D]">
                <AlertCircle size={16} />
                <span>Please fix the errors above</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default TradingForm;


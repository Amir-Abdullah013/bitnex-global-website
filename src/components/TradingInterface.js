'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import Input from './Input';
import { useToast, ToastContainer } from './Toast';
import { useUniversal } from '../lib/universal-context';
import { usePrice } from '../hooks/useWebSocket';
import { useTradingPair } from '../lib/trading-pair-context';

const TradingInterface = ({ className = '' }) => {
  const { usdBalance, bnxBalance, formatCurrency, formatBnx } = useUniversal();
  const { selectedPair, getPairAssets, getPairPrecision, getPairLimits, formatPrice, formatAmount, validateOrderAmount, validateOrderPrice } = useTradingPair();
  const { baseAsset, quoteAsset } = getPairAssets();
  const { priceData, isConnected } = usePrice(baseAsset);
  const [orderType, setOrderType] = useState('LIMIT');
  const [orderSide, setOrderSide] = useState('BUY');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Use real-time price data
  const currentPrice = priceData.price || 0;

  // Update price when market order is selected
  useEffect(() => {
    if (orderType === 'MARKET' && currentPrice > 0 && !price) {
      setPrice(currentPrice.toFixed(4));
    }
  }, [orderType, currentPrice, price]);

  // Fallback to API if WebSocket is not connected
  useEffect(() => {
    if (!isConnected) {
      fetchCurrentPriceFallback();
    }
  }, [isConnected]);

  const fetchCurrentPriceFallback = async () => {
    try {
      const response = await fetch(`/api/price?symbol=${baseAsset}`);
      const data = await response.json();
      if (data.success && data.price) {
        // Update price field for market orders
        if (orderType === 'MARKET' && !price) {
          setPrice(data.price.toFixed(4));
        }
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type === 'MARKET') {
      setPrice(currentPrice.toFixed(4));
    } else {
      setPrice('');
    }
  };

  const handleSideChange = (side) => {
    setOrderSide(side);
  };

  const calculateTotal = () => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = parseFloat(price) || 0;
    return amountNum * priceNum;
  };

  const getMaxAmount = () => {
    if (orderSide === 'BUY') {
      const priceNum = parseFloat(price) || currentPrice;
      return usdBalance / priceNum;
    } else {
      return bnxBalance;
    }
  };

  const handleMaxAmount = () => {
    const maxAmount = getMaxAmount();
    setAmount(maxAmount.toFixed(2));
  };

  const validateOrder = () => {
    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(price);

    if (!amountNum || amountNum <= 0) {
      addToast('Please enter a valid amount', 'error');
      return false;
    }

    if (orderType === 'LIMIT' && (!priceNum || priceNum <= 0)) {
      addToast('Please enter a valid price for limit orders', 'error');
      return false;
    }

    if (orderSide === 'BUY') {
      const requiredUSD = amountNum * (priceNum || currentPrice);
      if (requiredUSD > usdBalance) {
        addToast('Insufficient USD balance', 'error');
        return false;
      }
    } else {
      if (amountNum > bnxBalance) {
        addToast('Insufficient BNX balance', 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateOrder()) {
      return;
    }

    setIsSubmitting(true);

    try {
    const orderData = {
      type: orderType,
      side: orderSide,
      amount: parseFloat(amount),
      price: orderType === 'LIMIT' ? parseFloat(price) : null,
      tradingPair: selectedPair
    };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        addToast(`Order placed successfully! Order ID: ${data.order.id}`, 'success');
        
        // Reset form
        setAmount('');
        if (orderType === 'LIMIT') {
          setPrice('');
        }

        // Show match information if any
        if (data.matches && data.matches.length > 0) {
          addToast(`Order matched with ${data.matches.length} existing orders`, 'info');
        }
      } else {
        addToast(data.error || 'Failed to place order', 'error');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Place Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order Type Selection */}
            <div>
              <label className="block text-sm font-medium text-binance-textSecondary mb-2">
                Order Type
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={orderType === 'LIMIT' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleOrderTypeChange('LIMIT')}
                  className="flex-1"
                >
                  Limit
                </Button>
                <Button
                  type="button"
                  variant={orderType === 'MARKET' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleOrderTypeChange('MARKET')}
                  className="flex-1"
                >
                  Market
                </Button>
              </div>
            </div>

            {/* Order Side Selection */}
            <div>
              <label className="block text-sm font-medium text-binance-textSecondary mb-2">
                Order Side
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={orderSide === 'BUY' ? 'success' : 'outline'}
                  size="sm"
                  onClick={() => handleSideChange('BUY')}
                  className="flex-1"
                >
                  Buy
                </Button>
                <Button
                  type="button"
                  variant={orderSide === 'SELL' ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => handleSideChange('SELL')}
                  className="flex-1"
                >
                  Sell
                </Button>
              </div>
            </div>

            {/* Price Input (for Limit orders) */}
            {orderType === 'LIMIT' && (
              <Input
                label="Price (USD per BNX)"
                type="number"
                step="0.0001"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.0000"
                required
              />
            )}

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-binance-textSecondary">
                  Amount (BNX)
                </label>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-xs text-binance-primary hover:text-binance-primary/80"
                >
                  Max: {getMaxAmount().toFixed(2)}
                </button>
              </div>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Total Calculation */}
            {amount && (price || orderType === 'MARKET') && (
              <div className="p-3 bg-binance-surface rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-binance-textSecondary">Total Value:</span>
                  <span className="text-binance-textPrimary font-medium">
                    {formatCurrency(calculateTotal(), 'USD')}
                  </span>
                </div>
                {orderSide === 'BUY' && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-binance-textTertiary">Available USD:</span>
                    <span className="text-binance-textTertiary">
                      {formatCurrency(usdBalance, 'USD')}
                    </span>
                  </div>
                )}
                {orderSide === 'SELL' && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-binance-textTertiary">Available BNX:</span>
                    <span className="text-binance-textTertiary">
                      {formatBnx(bnxBalance)} BNX
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant={orderSide === 'BUY' ? 'success' : 'danger'}
              size="lg"
              fullWidth
              disabled={isSubmitting || !amount || (orderType === 'LIMIT' && !price)}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Placing Order...' : `${orderSide} ${orderType} Order`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Your Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-binance-textSecondary">USD Balance:</span>
              <span className="text-binance-textPrimary font-medium">
                {formatCurrency(usdBalance, 'USD')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-binance-textSecondary">BNX Balance:</span>
              <span className="text-binance-textPrimary font-medium">
                {formatBnx(bnxBalance)} BNX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-binance-textSecondary">Current Price:</span>
              <span className="text-binance-primary font-medium">
                {formatCurrency(currentPrice, 'USD')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TradingInterface;

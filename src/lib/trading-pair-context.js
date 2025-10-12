'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const TradingPairContext = createContext();

export const useTradingPair = () => {
  const context = useContext(TradingPairContext);
  if (!context) {
    throw new Error('useTradingPair must be used within a TradingPairProvider');
  }
  return context;
};

export const TradingPairProvider = ({ children }) => {
  const [selectedPair, setSelectedPair] = useState('BNX/USDT');
  const [tradingPairs, setTradingPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trading pairs on mount
  useEffect(() => {
    const fetchTradingPairs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/trading-pairs');
        const data = await response.json();

        if (data.success) {
          setTradingPairs(data.tradingPairs);
          
          // Set default pair if none selected
          if (!selectedPair && data.tradingPairs.length > 0) {
            setSelectedPair(data.tradingPairs[0].symbol);
          }
        } else {
          setError(data.error || 'Failed to fetch trading pairs');
        }
      } catch (err) {
        console.error('Error fetching trading pairs:', err);
        setError('Failed to fetch trading pairs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradingPairs();
  }, []);

  // Get current pair data
  const getCurrentPairData = () => {
    return tradingPairs.find(pair => pair.symbol === selectedPair);
  };

  // Get pair by symbol
  const getPairBySymbol = (symbol) => {
    return tradingPairs.find(pair => pair.symbol === symbol);
  };

  // Get base and quote assets
  const getPairAssets = () => {
    const pairData = getCurrentPairData();
    if (!pairData) return { baseAsset: 'BNX', quoteAsset: 'USDT' };
    
    return {
      baseAsset: pairData.baseAsset,
      quoteAsset: pairData.quoteAsset
    };
  };

  // Get pair precision settings
  const getPairPrecision = () => {
    const pairData = getCurrentPairData();
    if (!pairData) return { pricePrecision: 4, amountPrecision: 4 };
    
    return {
      pricePrecision: pairData.pricePrecision,
      amountPrecision: pairData.amountPrecision
    };
  };

  // Get pair fees
  const getPairFees = () => {
    const pairData = getCurrentPairData();
    if (!pairData) return { makerFee: 0.001, takerFee: 0.001 };
    
    return {
      makerFee: pairData.makerFee,
      takerFee: pairData.takerFee
    };
  };

  // Get pair order limits
  const getPairLimits = () => {
    const pairData = getCurrentPairData();
    if (!pairData) return { minOrderSize: 0.001, maxOrderSize: 1000000 };
    
    return {
      minOrderSize: pairData.minOrderSize,
      maxOrderSize: pairData.maxOrderSize
    };
  };

  // Format price with correct precision
  const formatPrice = (price) => {
    const { pricePrecision } = getPairPrecision();
    return price ? price.toFixed(pricePrecision) : '0';
  };

  // Format amount with correct precision
  const formatAmount = (amount) => {
    const { amountPrecision } = getPairPrecision();
    return amount ? amount.toFixed(amountPrecision) : '0';
  };

  // Validate order amount
  const validateOrderAmount = (amount) => {
    const { minOrderSize, maxOrderSize } = getPairLimits();
    
    if (amount < minOrderSize) {
      return { valid: false, error: `Minimum order size is ${minOrderSize}` };
    }
    
    if (amount > maxOrderSize) {
      return { valid: false, error: `Maximum order size is ${maxOrderSize}` };
    }
    
    return { valid: true };
  };

  // Validate order price
  const validateOrderPrice = (price) => {
    if (price <= 0) {
      return { valid: false, error: 'Price must be greater than 0' };
    }
    
    return { valid: true };
  };

  const value = {
    // State
    selectedPair,
    tradingPairs,
    isLoading,
    error,
    
    // Actions
    setSelectedPair,
    
    // Getters
    getCurrentPairData,
    getPairBySymbol,
    getPairAssets,
    getPairPrecision,
    getPairFees,
    getPairLimits,
    
    // Utilities
    formatPrice,
    formatAmount,
    validateOrderAmount,
    validateOrderPrice
  };

  return (
    <TradingPairContext.Provider value={value}>
      {children}
    </TradingPairContext.Provider>
  );
};

export default TradingPairContext;


/**
 * Market Ticker Component
 * Real-time cryptocurrency price ticker with Binance WebSocket data
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Volume2, Activity } from 'lucide-react';
import { connectToMultipleSymbols, disconnectFromAllSymbols } from '../lib/binanceSocket';

const MarketTicker = ({ 
  symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT'],
  showVolume = true,
  showChange = true,
  className = ''
}) => {
  const [tickerData, setTickerData] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const connectionIdRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize ticker data with default values
  useEffect(() => {
    const initialData = new Map();
    symbols.forEach(symbol => {
      initialData.set(symbol, {
        symbol,
        baseAsset: symbol.replace('USDT', '').replace('BTC', '').replace('ETH', ''),
        quoteAsset: 'USDT',
        lastPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        volume: 0,
        high24h: 0,
        low24h: 0,
        isPositive: true,
        formattedPrice: '0.00',
        formattedChange: '0.00',
        formattedVolume: '0',
        isLoading: true
      });
    });
    setTickerData(initialData);
  }, [symbols]);

  // Connect to WebSocket
  useEffect(() => {
    const handlePriceUpdate = (data) => {
      setTickerData(prevData => {
        const newData = new Map(prevData);
        newData.set(data.symbol, {
          ...data,
          isLoading: false,
          lastUpdate: Date.now()
        });
        return newData;
      });
      setLastUpdate(Date.now());
    };

    // Connect to multiple symbols
    connectionIdRef.current = connectToMultipleSymbols(symbols, handlePriceUpdate);
    setIsConnected(true);

    return () => {
      if (connectionIdRef.current) {
        disconnectFromAllSymbols();
        setIsConnected(false);
      }
    };
  }, [symbols]);

  // Animate price changes
  useEffect(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    animationRef.current = setTimeout(() => {
      // Trigger re-render for animations
      setTickerData(prev => new Map(prev));
    }, 100);
  }, [lastUpdate]);

  const getChangeColor = (isPositive) => {
    return isPositive ? '#0ECB81' : '#F6465D';
  };

  const getChangeIcon = (isPositive) => {
    return isPositive ? TrendingUp : TrendingDown;
  };

  const formatSymbol = (symbol) => {
    // Safety check for undefined
    if (!symbol) return 'N/A';
    
    // Extract base and quote properly
    let base = symbol;
    let quote = 'USDT';
    
    if (symbol.endsWith('USDT')) {
      base = symbol.slice(0, -4);
      quote = 'USDT';
    } else if (symbol.endsWith('BTC')) {
      base = symbol.slice(0, -3);
      quote = 'BTC';
    } else if (symbol.endsWith('ETH')) {
      base = symbol.slice(0, -3);
      quote = 'ETH';
    }
    
    return `${base}/${quote}`;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  const priceVariants = {
    updated: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`
        bg-[#181A20] border-b border-[#2B3139] 
        overflow-x-auto scrollbar-hide
        ${className}
      `}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2B3139]">
        <div className="flex items-center space-x-2">
          <Activity size={16} className="text-[#EAECEF]" />
          <span className="text-sm font-medium text-[#EAECEF]">
            Live Market Prices
          </span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
        </div>
        
        <div className="text-xs text-[#848E9C]">
          {lastUpdate && `Updated ${new Date(lastUpdate).toLocaleTimeString()}`}
        </div>
      </div>

      {/* Ticker List */}
      <div className="flex space-x-0">
        {Array.from(tickerData.values())
          .filter(data => data && data.symbol) // Safety check for undefined data
          .map((data, index) => {
          const ChangeIcon = getChangeIcon(data.isPositive);
          const changeColor = getChangeColor(data.isPositive);
          
          return (
            <motion.div
              key={data.symbol}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              transition={{ delay: index * 0.05 }}
              className="
                flex-shrink-0 w-64 px-4 py-3 
                border-r border-[#2B3139] last:border-r-0
                hover:bg-[#1E2329] transition-colors duration-200
                cursor-pointer group
              "
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                {/* Symbol and Price */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-[#EAECEF] group-hover:text-white">
                      {formatSymbol(data.symbol)}
                    </span>
                    {data.isLoading && (
                      <div className="w-3 h-3 border border-[#848E9C] border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  
                  <motion.div
                    key={data.lastPrice}
                    variants={priceVariants}
                    animate="updated"
                    className="text-lg font-bold text-[#EAECEF]"
                  >
                    ${data.formattedPrice || '0.00'}
                  </motion.div>
                </div>

                {/* Change and Volume */}
                <div className="text-right">
                  {showChange && (
                    <div className="flex items-center space-x-1 mb-1">
                      <ChangeIcon 
                        size={12} 
                        style={{ color: changeColor }}
                      />
                      <span 
                        className="text-sm font-medium"
                        style={{ color: changeColor }}
                      >
                        {data.isPositive ? '+' : ''}{(data.priceChangePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                  )}
                  
                  {showVolume && (
                    <div className="flex items-center space-x-1">
                      <Volume2 size={10} className="text-[#848E9C]" />
                      <span className="text-xs text-[#848E9C]">
                        {data.formattedVolume || '0'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 24h High/Low */}
              <div className="mt-2 flex items-center justify-between text-xs text-[#848E9C]">
                <span>24h High: ${data.high24h.toLocaleString()}</span>
                <span>24h Low: ${data.low24h.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Connection Status */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 bg-[#F6465D]/10 border-t border-[#F6465D]/20"
          >
            <div className="flex items-center space-x-2 text-sm text-[#F6465D]">
              <div className="w-2 h-2 bg-[#F6465D] rounded-full animate-pulse" />
              <span>Connecting to market data...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MarketTicker;



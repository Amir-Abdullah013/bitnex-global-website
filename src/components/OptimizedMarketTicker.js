/**
 * Optimized Market Ticker Component
 * High-performance market ticker with advanced optimizations
 */

'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Volume2, Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import useMarketTicker from '../hooks/useMarketTicker';

const OptimizedMarketTicker = memo(({ 
  symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT'],
  showVolume = true,
  showChange = true,
  showHighLow = false,
  className = '',
  onSymbolClick
}) => {
  const {
    tickerData,
    isConnected,
    lastUpdate,
    error,
    getSymbolData,
    getAllSymbolsData,
    isDataStale,
    reconnect,
    hasError
  } = useMarketTicker(symbols);

  // Memoize formatted data to prevent unnecessary re-renders
  const formattedData = useMemo(() => {
    return getAllSymbolsData().map(data => ({
      ...data,
      displayPrice: formatPrice(data.lastPrice),
      displayChange: formatChange(data.priceChangePercent),
      displayVolume: formatVolume(data.volume),
      displayHigh: formatPrice(data.high24h),
      displayLow: formatPrice(data.low24h)
    }));
  }, [getAllSymbolsData]);

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

  const formatChange = (change) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    } else {
      return volume.toFixed(2);
    }
  };

  const getChangeColor = (isPositive) => {
    return isPositive ? '#0ECB81' : '#F6465D';
  };

  const getChangeIcon = (isPositive) => {
    return isPositive ? TrendingUp : TrendingDown;
  };

  const formatSymbol = (symbol) => {
    const base = symbol.replace('USDT', '').replace('BTC', '').replace('ETH', '');
    const quote = symbol.includes('USDT') ? 'USDT' : symbol.includes('BTC') ? 'BTC' : 'ETH';
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
          {isDataStale() && (
            <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasError && (
            <motion.button
              onClick={reconnect}
              className="p-1 rounded hover:bg-[#2B3139] transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <RefreshCw size={14} className="text-[#F0B90B]" />
            </motion.button>
          )}
          
          <div className="text-xs text-[#848E9C]">
            {lastUpdate && `Updated ${new Date(lastUpdate).toLocaleTimeString()}`}
          </div>
        </div>
      </div>

      {/* Error State */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 bg-[#F6465D]/10 border-b border-[#F6465D]/20"
          >
            <div className="flex items-center space-x-2 text-sm text-[#F6465D]">
              <AlertTriangle size={14} />
              <span>{error}</span>
              <button 
                onClick={reconnect}
                className="underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticker List */}
      <div className="flex space-x-0">
        {formattedData.map((data, index) => {
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
              onClick={() => onSymbolClick?.(data.symbol)}
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
                    ${data.displayPrice}
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
                        {data.displayChange}
                      </span>
                    </div>
                  )}
                  
                  {showVolume && (
                    <div className="flex items-center space-x-1">
                      <Volume2 size={10} className="text-[#848E9C]" />
                      <span className="text-xs text-[#848E9C]">
                        {data.displayVolume}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 24h High/Low */}
              {showHighLow && (
                <div className="mt-2 flex items-center justify-between text-xs text-[#848E9C]">
                  <span>H: ${data.displayHigh}</span>
                  <span>L: ${data.displayLow}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Connection Status */}
      <AnimatePresence>
        {!isConnected && !hasError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 bg-[#F59E0B]/10 border-t border-[#F59E0B]/20"
          >
            <div className="flex items-center space-x-2 text-sm text-[#F59E0B]">
              <div className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
              <span>Connecting to market data...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

OptimizedMarketTicker.displayName = 'OptimizedMarketTicker';

export default OptimizedMarketTicker;


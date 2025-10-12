/**
 * Market Navigation Component
 * Navigation for individual coin trading pages
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star, 
  StarOff,
  BarChart3,
  Activity,
  DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import useMarketTicker from '../../hooks/useMarketTicker';

const MarketNavigation = ({ 
  className = '',
  showFavorites = true,
  showSearch = true,
  maxItems = 10
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set(['BTCUSDT', 'ETHUSDT', 'BNBUSDT']));
  const [filteredSymbols, setFilteredSymbols] = useState([]);

  // Get market data
  const { 
    getAllSymbolsData, 
    getTopGainers, 
    getTopLosers,
    isConnected 
  } = useMarketTicker(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT', 'LINKUSDT', 'UNIUSDT', 'LTCUSDT']);

  const allSymbols = getAllSymbolsData();
  const topGainers = getTopGainers(5);
  const topLosers = getTopLosers(5);

  // Filter symbols based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = allSymbols.filter(symbol => 
        symbol.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        symbol.baseAsset.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSymbols(filtered.slice(0, maxItems));
    } else {
      setFilteredSymbols(allSymbols.slice(0, maxItems));
    }
  }, [searchQuery, allSymbols, maxItems]);

  const handleSymbolClick = (symbol) => {
    router.push(`/trade/${symbol.toLowerCase()}`);
  };

  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const getChangeColor = (isPositive) => {
    return isPositive ? '#0ECB81' : '#F6465D';
  };

  const getChangeIcon = (isPositive) => {
    return isPositive ? TrendingUp : TrendingDown;
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

  const itemVariants = {
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
          <BarChart3 size={20} className="text-[#F0B90B]" />
          <span className="text-lg font-semibold text-[#EAECEF]">
            Markets
          </span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
        </div>
        
        <div className="flex items-center space-x-2">
          <Activity size={16} className="text-[#B7BDC6]" />
          <span className="text-sm text-[#B7BDC6]">
            {allSymbols.length} pairs
          </span>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b border-[#2B3139]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B7BDC6]" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2B3139] border border-[#3C4043] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0B90B] text-[#EAECEF] placeholder-[#B7BDC6]"
            />
          </div>
        </div>
      )}

      {/* Top Gainers */}
      {!searchQuery && topGainers.length > 0 && (
        <div className="p-4 border-b border-[#2B3139]">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp size={16} className="text-[#0ECB81]" />
            <span className="text-sm font-medium text-[#EAECEF]">Top Gainers</span>
          </div>
          <div className="space-y-2">
            {topGainers.map((symbol, index) => (
              <motion.div
                key={symbol.symbol}
                initial="hidden"
                animate="visible"
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 rounded hover:bg-[#2B3139] transition-colors cursor-pointer group"
                onClick={() => handleSymbolClick(symbol.symbol)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-[#EAECEF] group-hover:text-white">
                    {symbol.symbol.replace('USDT', '/USDT')}
                  </span>
                  <span className="text-xs text-[#B7BDC6]">
                    ${formatPrice(symbol.lastPrice)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-sm font-medium"
                    style={{ color: getChangeColor(symbol.isPositive) }}
                  >
                    +{symbol.priceChangePercent.toFixed(2)}%
                  </span>
                  {showFavorites && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(symbol.symbol);
                      }}
                      className="p-1 rounded hover:bg-[#3C4043] transition-colors"
                    >
                      {favorites.has(symbol.symbol) ? (
                        <Star size={14} className="text-[#F0B90B]" />
                      ) : (
                        <StarOff size={14} className="text-[#B7BDC6]" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Top Losers */}
      {!searchQuery && topLosers.length > 0 && (
        <div className="p-4 border-b border-[#2B3139]">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingDown size={16} className="text-[#F6465D]" />
            <span className="text-sm font-medium text-[#EAECEF]">Top Losers</span>
          </div>
          <div className="space-y-2">
            {topLosers.map((symbol, index) => (
              <motion.div
                key={symbol.symbol}
                initial="hidden"
                animate="visible"
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 rounded hover:bg-[#2B3139] transition-colors cursor-pointer group"
                onClick={() => handleSymbolClick(symbol.symbol)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-[#EAECEF] group-hover:text-white">
                    {symbol.symbol.replace('USDT', '/USDT')}
                  </span>
                  <span className="text-xs text-[#B7BDC6]">
                    ${formatPrice(symbol.lastPrice)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-sm font-medium"
                    style={{ color: getChangeColor(symbol.isPositive) }}
                  >
                    {symbol.priceChangePercent.toFixed(2)}%
                  </span>
                  {showFavorites && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(symbol.symbol);
                      }}
                      className="p-1 rounded hover:bg-[#3C4043] transition-colors"
                    >
                      {favorites.has(symbol.symbol) ? (
                        <Star size={14} className="text-[#F0B90B]" />
                      ) : (
                        <StarOff size={14} className="text-[#B7BDC6]" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Markets */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#EAECEF]">
            {searchQuery ? 'Search Results' : 'All Markets'}
          </span>
          <span className="text-xs text-[#B7BDC6]">
            {filteredSymbols.length} pairs
          </span>
        </div>
        
        <div className="space-y-1">
          <AnimatePresence>
            {filteredSymbols.map((symbol, index) => (
              <motion.div
                key={symbol.symbol}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={itemVariants}
                transition={{ delay: index * 0.02 }}
                className="flex items-center justify-between p-2 rounded hover:bg-[#2B3139] transition-colors cursor-pointer group"
                onClick={() => handleSymbolClick(symbol.symbol)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-[#EAECEF] group-hover:text-white">
                    {symbol.symbol.replace('USDT', '/USDT')}
                  </span>
                  <span className="text-xs text-[#B7BDC6]">
                    ${formatPrice(symbol.lastPrice)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getChangeIcon(symbol.isPositive) && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.3 }}
                      >
                        {React.createElement(getChangeIcon(symbol.isPositive), { 
                          size: 12, 
                          style: { color: getChangeColor(symbol.isPositive) } 
                        })}
                      </motion.div>
                    )}
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getChangeColor(symbol.isPositive) }}
                    >
                      {symbol.priceChange >= 0 ? '+' : ''}{symbol.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  
                  {showFavorites && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(symbol.symbol);
                      }}
                      className="p-1 rounded hover:bg-[#3C4043] transition-colors"
                    >
                      {favorites.has(symbol.symbol) ? (
                        <Star size={14} className="text-[#F0B90B]" />
                      ) : (
                        <StarOff size={14} className="text-[#B7BDC6]" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketNavigation;



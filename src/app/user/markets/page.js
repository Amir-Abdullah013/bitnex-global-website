/**
 * Markets Overview Page
 * Page showing all available trading pairs with navigation to individual trading pages
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Star, 
  StarOff, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  Volume2,
  DollarSign,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import MarketNavigation from '../../../components/navigation/MarketNavigation';
import useMarketTicker from '../../../hooks/useMarketTicker';

const MarketsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [favorites, setFavorites] = useState(new Set(['BTCUSDT', 'ETHUSDT', 'BNBUSDT']));

  // Get market data
  const { 
    getAllSymbolsData, 
    getTopGainers, 
    getTopLosers,
    isConnected 
  } = useMarketTicker(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT', 'LINKUSDT', 'UNIUSDT', 'LTCUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'NEARUSDT', 'FTMUSDT']);

  const allSymbols = getAllSymbolsData();
  const topGainers = getTopGainers(10);
  const topLosers = getTopLosers(10);

  // Filter and sort symbols
  const filteredSymbols = allSymbols
    .filter(symbol => {
      // Safety check for undefined or incomplete symbols
      if (!symbol || !symbol.symbol || !symbol.baseAsset) {
        return false;
      }
      
      const matchesSearch = symbol.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          symbol.baseAsset.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'favorites' && favorites.has(symbol.symbol)) ||
                           (filterBy === 'gainers' && symbol.isPositive) ||
                           (filterBy === 'losers' && !symbol.isPositive);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Additional safety check during sort
      if (!a || !b) return 0;
      
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.lastPrice || 0;
          bValue = b.lastPrice || 0;
          break;
        case 'change':
          aValue = a.priceChangePercent || 0;
          bValue = b.priceChangePercent || 0;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        default:
          aValue = a.lastPrice || 0;
          bValue = b.lastPrice || 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

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

  const handleSymbolClick = (symbol) => {
    router.push(`/trade/${symbol.toLowerCase()}`);
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

  return (
    <div className="min-h-screen bg-[#181A20]">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-6 border-b border-[#2B3139]"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#EAECEF]">Markets</h1>
            <p className="text-[#B7BDC6] mt-1">
              Trade cryptocurrencies with live market data
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
            <span className="text-sm text-[#B7BDC6]">
              {isConnected ? 'Live Data' : 'Connecting...'}
            </span>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants} className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B7BDC6]" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1E2329] border border-[#2B3139] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0B90B] text-[#EAECEF] placeholder-[#B7BDC6]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 bg-[#1E2329] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]"
            >
              <option value="all">All Markets</option>
              <option value="favorites">Favorites</option>
              <option value="gainers">Top Gainers</option>
              <option value="losers">Top Losers</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#1E2329] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]"
            >
              <option value="price">Price</option>
              <option value="change">Change</option>
              <option value="volume">Volume</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-[#1E2329] border border-[#2B3139] rounded-lg text-[#EAECEF] hover:bg-[#2B3139] transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-6"
      >
        {/* Top Performers */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Gainers */}
          <div className="bg-[#1E2329] rounded-lg border border-[#2B3139] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp size={20} className="text-[#0ECB81]" />
              <h2 className="text-lg font-semibold text-[#EAECEF]">Top Gainers</h2>
            </div>
            <div className="space-y-3">
              {topGainers.filter(symbol => symbol && symbol.symbol).map((symbol, index) => (
                <motion.div
                  key={symbol.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2B3139] transition-colors cursor-pointer group"
                  onClick={() => handleSymbolClick(symbol.symbol)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-[#EAECEF] group-hover:text-white">
                      {symbol.symbol.replace('USDT', '/USDT')}
                    </span>
                    <span className="text-xs text-[#B7BDC6]">
                      ${formatPrice(symbol.lastPrice || 0)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getChangeColor(symbol.isPositive) }}
                    >
                      +{(symbol.priceChangePercent || 0).toFixed(2)}%
                    </span>
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
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-[#1E2329] rounded-lg border border-[#2B3139] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingDown size={20} className="text-[#F6465D]" />
              <h2 className="text-lg font-semibold text-[#EAECEF]">Top Losers</h2>
            </div>
            <div className="space-y-3">
              {topLosers.filter(symbol => symbol && symbol.symbol).map((symbol, index) => (
                <motion.div
                  key={symbol.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2B3139] transition-colors cursor-pointer group"
                  onClick={() => handleSymbolClick(symbol.symbol)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-[#EAECEF] group-hover:text-white">
                      {symbol.symbol.replace('USDT', '/USDT')}
                    </span>
                    <span className="text-xs text-[#B7BDC6]">
                      ${formatPrice(symbol.lastPrice || 0)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getChangeColor(symbol.isPositive) }}
                    >
                      {(symbol.priceChangePercent || 0).toFixed(2)}%
                    </span>
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
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* All Markets */}
        <motion.div variants={itemVariants} className="bg-[#1E2329] rounded-lg border border-[#2B3139]">
          <div className="p-6 border-b border-[#2B3139]">
            <h2 className="text-lg font-semibold text-[#EAECEF]">All Markets</h2>
            <p className="text-sm text-[#B7BDC6] mt-1">
              {filteredSymbols.length} trading pairs available
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2B3139]">
                  <th className="text-left p-4 text-sm font-medium text-[#B7BDC6]">Pair</th>
                  <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">Price</th>
                  <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">Change</th>
                  <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">Volume</th>
                  <th className="text-center p-4 text-sm font-medium text-[#B7BDC6]">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredSymbols.map((symbol, index) => (
                    <motion.tr
                      key={symbol.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-[#2B3139] hover:bg-[#2B3139]/50 transition-colors cursor-pointer"
                      onClick={() => handleSymbolClick(symbol.symbol)}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-[#EAECEF]">
                            {symbol.symbol.replace('USDT', '/USDT')}
                          </span>
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
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-medium text-[#EAECEF]">
                          ${formatPrice(symbol.lastPrice)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
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
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm text-[#B7BDC6]">
                          {formatVolume(symbol.volume)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSymbolClick(symbol.symbol);
                          }}
                          className="px-3 py-1 bg-[#F0B90B] text-[#181A20] rounded text-sm font-medium hover:bg-[#FCD535] transition-colors"
                        >
                          Trade
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MarketsPage;

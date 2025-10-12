/**
 * Integrated Markets Page
 * Complete markets page with Market Ticker and enhanced navigation
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  SortDesc,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import MarketTicker from '../../components/MarketTicker';
import { connectToMultipleSymbols, disconnectFromAllSymbols } from '../../lib/binanceSocket';

const MarketsIntegrated = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [favorites, setFavorites] = useState(new Set(['BTCUSDT', 'ETHUSDT', 'BNBUSDT']));
  const [marketData, setMarketData] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [expandedFilters, setExpandedFilters] = useState(false);

  // Supported trading pairs
  const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT',
    'DOTUSDT', 'LINKUSDT', 'UNIUSDT', 'LTCUSDT', 'MATICUSDT', 'AVAXUSDT',
    'ATOMUSDT', 'NEARUSDT', 'FTMUSDT', 'ALGOUSDT', 'VETUSDT', 'ICPUSDT',
    'THETAUSDT', 'FILUSDT', 'TRXUSDT', 'EOSUSDT', 'AAVEUSDT', 'SUSHIUSDT'
  ];

  // Connect to WebSocket streams
  useEffect(() => {
    const handlePriceUpdate = (data) => {
      setMarketData(prevData => {
        const newData = new Map(prevData);
        newData.set(data.symbol, {
          ...data,
          lastUpdate: Date.now()
        });
        return newData;
      });
      setLastUpdate(Date.now());
      setError(null);
    };

    try {
      const connectionId = connectToMultipleSymbols(tradingPairs, handlePriceUpdate);
      setIsConnected(true);
      
      return () => {
        disconnectFromAllSymbols();
        setIsConnected(false);
      };
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    }
  }, []);

  // Filter and sort market data
  const filteredAndSortedData = useMemo(() => {
    const dataArray = Array.from(marketData.values());
    
    let filtered = dataArray.filter(symbol => {
      const matchesSearch = symbol.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          symbol.baseAsset.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'favorites' && favorites.has(symbol.symbol)) ||
                           (filterBy === 'gainers' && symbol.isPositive) ||
                           (filterBy === 'losers' && !symbol.isPositive);
      return matchesSearch && matchesFilter;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.lastPrice;
          bValue = b.lastPrice;
          break;
        case 'change':
          aValue = a.priceChangePercent;
          bValue = b.priceChangePercent;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        case 'name':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        default:
          aValue = a.volume;
          bValue = b.volume;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [marketData, searchQuery, filterBy, favorites, sortBy, sortOrder]);

  // Get top performers
  const topGainers = useMemo(() => {
    return Array.from(marketData.values())
      .filter(symbol => symbol.isPositive)
      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
      .slice(0, 5);
  }, [marketData]);

  const topLosers = useMemo(() => {
    return Array.from(marketData.values())
      .filter(symbol => !symbol.isPositive)
      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
      .slice(0, 5);
  }, [marketData]);

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
    <div className="min-h-screen bg-[#0B0E11]">
      {/* Market Ticker */}
      <MarketTicker 
        symbols={['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT']}
        className="sticky top-0 z-40"
      />

      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-6 border-b border-[#1E2329]"
      >
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#EAECEF]">Markets</h1>
            <p className="text-[#B7BDC6] mt-2">
              Trade cryptocurrencies with live market data
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
              <span className="text-sm text-[#B7BDC6]">
                {isConnected ? 'Live Data' : 'Connecting...'}
              </span>
            </div>
            
            {lastUpdate && (
              <span className="text-xs text-[#848E9C]">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants} className="mt-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B7BDC6]" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#181A20] border border-[#2B3139] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0B90B] text-[#EAECEF] placeholder-[#B7BDC6]"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="flex items-center space-x-2 px-4 py-3 bg-[#181A20] border border-[#2B3139] rounded-lg text-[#EAECEF] hover:bg-[#2B3139] transition-colors"
              >
                <Filter size={16} />
                <span>Filters</span>
                {expandedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="p-3 bg-[#181A20] border border-[#2B3139] rounded-lg text-[#EAECEF] hover:bg-[#2B3139] transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {expandedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#181A20] border border-[#2B3139] rounded-lg p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#EAECEF] mb-2">
                      Filter By
                    </label>
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]"
                    >
                      <option value="all">All Markets</option>
                      <option value="favorites">Favorites</option>
                      <option value="gainers">Top Gainers</option>
                      <option value="losers">Top Losers</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#EAECEF] mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0E11] border border-[#2B3139] rounded-lg text-[#EAECEF] focus:outline-none focus:ring-2 focus:ring-[#F0B90B]"
                    >
                      <option value="name">Name</option>
                      <option value="price">Price</option>
                      <option value="change">Change</option>
                      <option value="volume">Volume</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#EAECEF] mb-2">
                      Order
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSortOrder('asc')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortOrder === 'asc'
                            ? 'bg-[#F0B90B] text-[#0B0E11]'
                            : 'bg-[#2B3139] text-[#EAECEF] hover:bg-[#3C4043]'
                        }`}
                      >
                        <SortAsc size={16} className="inline mr-1" />
                        Asc
                      </button>
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortOrder === 'desc'
                            ? 'bg-[#F0B90B] text-[#0B0E11]'
                            : 'bg-[#2B3139] text-[#EAECEF] hover:bg-[#3C4043]'
                        }`}
                      >
                        <SortDesc size={16} className="inline mr-1" />
                        Desc
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-[#F6465D]/10 border-b border-[#F6465D]/20"
          >
            <div className="flex items-center space-x-2 text-sm text-[#F6465D]">
              <AlertTriangle size={16} />
              <span>Connection Error: {error}</span>
              <button 
                onClick={() => window.location.reload()}
                className="ml-auto underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="bg-[#181A20] rounded-lg border border-[#2B3139] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp size={20} className="text-[#0ECB81]" />
              <h2 className="text-lg font-semibold text-[#EAECEF]">Top Gainers</h2>
            </div>
            <div className="space-y-3">
              {topGainers.map((symbol, index) => (
                <motion.div
                  key={symbol.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2B3139] transition-colors cursor-pointer group"
                  onClick={() => handleSymbolClick(symbol.symbol)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-[#EAECEF] group-hover:text-[#F0B90B]">
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
          <div className="bg-[#181A20] rounded-lg border border-[#2B3139] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingDown size={20} className="text-[#F6465D]" />
              <h2 className="text-lg font-semibold text-[#EAECEF]">Top Losers</h2>
            </div>
            <div className="space-y-3">
              {topLosers.map((symbol, index) => (
                <motion.div
                  key={symbol.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2B3139] transition-colors cursor-pointer group"
                  onClick={() => handleSymbolClick(symbol.symbol)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-[#EAECEF] group-hover:text-[#F0B90B]">
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

        {/* Markets Table */}
        <motion.div variants={itemVariants} className="bg-[#181A20] rounded-lg border border-[#2B3139] overflow-hidden">
          <div className="p-6 border-b border-[#2B3139]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#EAECEF]">All Markets</h2>
              <div className="flex items-center space-x-4 text-sm text-[#B7BDC6]">
                <span>{filteredAndSortedData.length} pairs</span>
                <div className="flex items-center space-x-1">
                  <Activity size={14} />
                  <span>Live Data</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2B3139]">
                  <th className="text-left p-4 text-sm font-medium text-[#B7BDC6]">Pair</th>
                  <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">Last Price</th>
                  <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">24h Change</th>
                  <th className="text-right p-4 text-sm font-medium text-[#B7BDC6]">24h Volume</th>
                  <th className="text-center p-4 text-sm font-medium text-[#B7BDC6]">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAndSortedData.map((symbol, index) => (
                    <motion.tr
                      key={symbol.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-[#2B3139] hover:bg-[#1E2329] transition-colors cursor-pointer group"
                      onClick={() => handleSymbolClick(symbol.symbol)}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-[#EAECEF] group-hover:text-[#F0B90B]">
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
                          className="px-4 py-2 bg-[#F0B90B] text-[#0B0E11] rounded text-sm font-medium hover:bg-[#FCD535] transition-colors"
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

export default MarketsIntegrated;

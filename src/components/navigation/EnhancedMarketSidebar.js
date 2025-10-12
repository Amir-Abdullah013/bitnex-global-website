/**
 * Enhanced Market Sidebar
 * Sidebar with market navigation and individual coin trading links
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Star,
  StarOff,
  Search,
  Activity,
  DollarSign,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import useMarketTicker from '../../hooks/useMarketTicker';

const EnhancedMarketSidebar = ({ 
  isCollapsed = false, 
  onToggle, 
  activeItem = 'dashboard' 
}) => {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({
    markets: true,
    favorites: true,
    topGainers: false,
    topLosers: false
  });
  const [favorites, setFavorites] = useState(new Set(['BTCUSDT', 'ETHUSDT', 'BNBUSDT']));

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/user/dashboard' },
    { id: 'markets', label: 'Markets', icon: BarChart3, path: '/user/markets' },
    { id: 'trading', label: 'Trading', icon: TrendingUp, path: '/user/trade' }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 64 }
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
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      className="fixed left-0 top-0 h-full z-50 bg-[#1E2329] border-r border-[#2B3139] shadow-lg transition-all duration-300 ease-in-out"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2B3139]">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-[#F0B90B] rounded-lg flex items-center justify-center">
                <span className="text-[#181A20] font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-[#EAECEF]">Bitnex</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-[#2B3139] transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial="hidden"
                animate="visible"
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <motion.a
                  href={item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-[#F0B90B]/20 text-[#F0B90B]' 
                      : 'text-[#B7BDC6] hover:bg-[#2B3139] hover:text-[#EAECEF]'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? 'text-[#F0B90B]' : ''} 
                  />
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.a>
              </motion.div>
            );
          })}
        </div>

        {/* Market Sections */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6 space-y-4"
            >
              {/* Top Gainers */}
              <div>
                <motion.button
                  onClick={() => toggleSection('topGainers')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={16} className="text-[#0ECB81]" />
                    <span>Top Gainers</span>
                  </div>
                  {expandedSections.topGainers ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </motion.button>
                
                <AnimatePresence>
                  {expandedSections.topGainers && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 mt-2 space-y-1"
                    >
                      {topGainers.map((symbol, index) => (
                        <motion.div
                          key={symbol.symbol}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-2 rounded hover:bg-[#2B3139] transition-colors cursor-pointer group"
                          onClick={() => handleSymbolClick(symbol.symbol)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-[#EAECEF] group-hover:text-white">
                              {symbol.symbol.replace('USDT', '/USDT')}
                            </span>
                            <span className="text-xs text-[#B7BDC6]">
                              ${formatPrice(symbol.lastPrice)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span 
                              className="text-xs font-medium"
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
                                <Star size={12} className="text-[#F0B90B]" />
                              ) : (
                                <StarOff size={12} className="text-[#B7BDC6]" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Top Losers */}
              <div>
                <motion.button
                  onClick={() => toggleSection('topLosers')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingDown size={16} className="text-[#F6465D]" />
                    <span>Top Losers</span>
                  </div>
                  {expandedSections.topLosers ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </motion.button>
                
                <AnimatePresence>
                  {expandedSections.topLosers && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 mt-2 space-y-1"
                    >
                      {topLosers.map((symbol, index) => (
                        <motion.div
                          key={symbol.symbol}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-2 rounded hover:bg-[#2B3139] transition-colors cursor-pointer group"
                          onClick={() => handleSymbolClick(symbol.symbol)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-[#EAECEF] group-hover:text-white">
                              {symbol.symbol.replace('USDT', '/USDT')}
                            </span>
                            <span className="text-xs text-[#B7BDC6]">
                              ${formatPrice(symbol.lastPrice)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span 
                              className="text-xs font-medium"
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
                                <Star size={12} className="text-[#F0B90B]" />
                              ) : (
                                <StarOff size={12} className="text-[#B7BDC6]" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Favorites */}
              <div>
                <motion.button
                  onClick={() => toggleSection('favorites')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2">
                    <Star size={16} className="text-[#F0B90B]" />
                    <span>Favorites</span>
                  </div>
                  {expandedSections.favorites ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </motion.button>
                
                <AnimatePresence>
                  {expandedSections.favorites && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 mt-2 space-y-1"
                    >
                      {Array.from(favorites).map((symbol, index) => {
                        const symbolData = allSymbols.find(s => s.symbol === symbol);
                        if (!symbolData) return null;
                        
                        return (
                          <motion.div
                            key={symbol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-2 rounded hover:bg-[#2B3139] transition-colors cursor-pointer group"
                            onClick={() => handleSymbolClick(symbol)}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-[#EAECEF] group-hover:text-white">
                                {symbol.replace('USDT', '/USDT')}
                              </span>
                              <span className="text-xs text-[#B7BDC6]">
                                ${formatPrice(symbolData.lastPrice)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span 
                                className="text-xs font-medium"
                                style={{ color: getChangeColor(symbolData.isPositive) }}
                              >
                                {symbolData.priceChange >= 0 ? '+' : ''}{symbolData.priceChangePercent.toFixed(2)}%
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(symbol);
                                }}
                                className="p-1 rounded hover:bg-[#3C4043] transition-colors"
                              >
                                <Star size={12} className="text-[#F0B90B]" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2B3139]">
        <div className="flex items-center justify-between text-xs text-[#B7BDC6]">
          <div className="flex items-center space-x-1">
            <Activity size={12} />
            <span>Live Data</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedMarketSidebar;



/**
 * Enhanced Navigation Bar
 * Navigation bar with Markets link and live data indicators
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  TrendingUp, 
  User, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Activity,
  Star,
  DollarSign
} from 'lucide-react';
import { connectToMultipleSymbols, disconnectFromAllSymbols } from '../../lib/binanceSocket';

const EnhancedNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'markets', label: 'Markets', icon: BarChart3, path: '/markets' },
    { id: 'trade', label: 'Trade', icon: TrendingUp, path: '/user/trade' },
    { id: 'dashboard', label: 'Dashboard', icon: User, path: '/user/dashboard' }
  ];

  // Connect to WebSocket for live data indicator
  useEffect(() => {
    const handlePriceUpdate = (data) => {
      setLastUpdate(Date.now());
    };

    try {
      const connectionId = connectToMultipleSymbols(['BTCUSDT', 'ETHUSDT'], handlePriceUpdate);
      setIsConnected(true);
      
      return () => {
        disconnectFromAllSymbols();
        setIsConnected(false);
      };
    } catch (err) {
      setIsConnected(false);
    }
  }, []);

  const handleNavClick = (path) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
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

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-[#0B0E11] border-b border-[#1E2329] sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-[#F0B90B] rounded-lg flex items-center justify-center">
              <span className="text-[#0B0E11] font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-bold text-[#EAECEF]">Bitnex</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <motion.button
                  key={item.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleNavClick(item.path)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg
                    transition-all duration-200 group relative
                    ${active 
                      ? 'bg-[#F0B90B]/20 text-[#F0B90B]' 
                      : 'text-[#B7BDC6] hover:bg-[#181A20] hover:text-[#EAECEF]'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={18} className={active ? 'text-[#F0B90B]' : ''} />
                  <span className="font-medium">{item.label}</span>
                  
                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0B90B] rounded-full"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Live Data Indicator */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-[#B7BDC6]">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
              <span>{isConnected ? 'Live' : 'Offline'}</span>
              {lastUpdate && (
                <span className="text-xs">
                  {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Search */}
            <div className="hidden sm:block relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B7BDC6]" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-[#181A20] border border-[#2B3139] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0B90B] text-[#EAECEF] placeholder-[#B7BDC6] w-64"
              />
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors"
            >
              <Bell size={18} />
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors"
            >
              <Settings size={18} />
            </motion.button>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#1E2329] py-4"
            >
              <div className="space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleNavClick(item.path)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                        transition-all duration-200
                        ${active 
                          ? 'bg-[#F0B90B]/20 text-[#F0B90B]' 
                          : 'text-[#B7BDC6] hover:bg-[#181A20] hover:text-[#EAECEF]'
                        }
                      `}
                    >
                      <Icon size={20} className={active ? 'text-[#F0B90B]' : ''} />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Mobile Search */}
              <div className="mt-4 pt-4 border-t border-[#1E2329]">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B7BDC6]" />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    className="w-full pl-10 pr-4 py-3 bg-[#181A20] border border-[#2B3139] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0B90B] text-[#EAECEF] placeholder-[#B7BDC6]"
                  />
                </div>
              </div>

              {/* Mobile Live Data Indicator */}
              <div className="mt-4 pt-4 border-t border-[#1E2329]">
                <div className="flex items-center justify-between text-sm text-[#B7BDC6]">
                  <div className="flex items-center space-x-2">
                    <Activity size={16} />
                    <span>Market Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
                    <span>{isConnected ? 'Live' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default EnhancedNavbar;

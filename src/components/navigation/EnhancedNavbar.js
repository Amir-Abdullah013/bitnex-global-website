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
  DollarSign,
  LogOut,
  LogIn,
  Users
} from 'lucide-react';
import { connectToMultipleSymbols, disconnectFromAllSymbols } from '../../lib/binanceSocket';
import { useAuth } from '../../lib/auth-context';

const EnhancedNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [fallbackAuth, setFallbackAuth] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Debug authentication state and add fallback
  useEffect(() => {
    console.log('🔍 EnhancedNavbar Auth State:', {
      isAuthenticated,
      user: user ? { name: user.name, email: user.email } : null,
      pathname
    });
    
    // Fallback check for localStorage session
    const userSession = localStorage.getItem('userSession');
    if (userSession && !isAuthenticated) {
      console.log('🔧 Found localStorage session but auth context not authenticated');
      try {
        const sessionData = JSON.parse(userSession);
        console.log('🔧 Session data:', sessionData);
        setFallbackAuth(sessionData);
      } catch (e) {
        console.error('🔧 Error parsing session data:', e);
        setFallbackAuth(null);
      }
    } else {
      setFallbackAuth(null);
    }
  }, [isAuthenticated, user, pathname]);

  // Use fallback auth if main auth context is not working
  const effectiveAuth = isAuthenticated || !!fallbackAuth;
  const effectiveUser = user || fallbackAuth;

  // Navigation items - conditional based on effective authentication
  const navItems = effectiveAuth ? [
    { id: 'dashboard', label: 'Dashboard', icon: User, path: '/user/dashboard' },
    { id: 'markets', label: 'Markets', icon: BarChart3, path: '/markets' },
    { id: 'trade', label: 'Trade', icon: TrendingUp, path: '/user/trade' },
  ] : [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'markets', label: 'Markets', icon: BarChart3, path: '/markets' }
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
      if (isNotificationOpen) {
        setIsNotificationOpen(false);
      }
    };

    if (isUserMenuOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isNotificationOpen]);

  // Load notifications when authenticated
  useEffect(() => {
    if (effectiveAuth) {
      loadNotifications();
    }
  }, [effectiveAuth]);

  const handleNavClick = (path) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsUserMenuOpen(false); // Close user menu if open
  };

  const loadNotifications = async () => {
    try {
      // Mock notifications for now - you can replace with real API call
      const mockNotifications = [
        {
          id: '1',
          title: 'Welcome to Bitnex!',
          message: 'Your account has been successfully created.',
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'New Trade Alert',
          message: 'Your BTC order has been executed.',
          type: 'info',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false
        },
        {
          id: '3',
          title: 'Security Update',
          message: 'Please update your password for better security.',
          type: 'warning',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true
        }
      ];
      
      setNotifications(mockNotifications);
      setNotificationCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
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

            {/* Authentication Section */}
            {effectiveAuth ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNotificationClick}
                    className="p-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors relative"
                  >
                    <Bell size={18} />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </motion.button>

                  {/* Notification Dropdown */}
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-[#181A20] border border-[#2B3139] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="p-4 border-b border-[#2B3139]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[#EAECEF] font-semibold">Notifications</h3>
                          <span className="text-[#B7BDC6] text-sm">{notifications.length} total</span>
                        </div>
                      </div>
                      <div className="py-2">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-[#B7BDC6]">
                            <Bell size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-[#2B3139] transition-colors cursor-pointer ${
                                !notification.read ? 'bg-[#2B3139]/50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'success' ? 'bg-green-500' :
                                  notification.type === 'warning' ? 'bg-yellow-500' :
                                  notification.type === 'error' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[#EAECEF] font-medium text-sm">
                                    {notification.title}
                                  </p>
                                  <p className="text-[#B7BDC6] text-xs mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-[#B7BDC6] text-xs mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-[#F0B90B] rounded-full mt-2" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-4 border-t border-[#2B3139]">
                          <button
                            onClick={() => {
                              console.log('🔔 Navigating to notifications page...');
                              setIsNotificationOpen(false);
                              router.push('/user/notifications');
                            }}
                            className="w-full text-center text-[#F0B90B] hover:text-[#F0B90B]/80 text-sm font-medium"
                          >
                            View All Notifications
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#F0B90B] rounded-full flex items-center justify-center">
                      <span className="text-[#0B0E11] font-bold text-sm">
                        {effectiveUser?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{effectiveUser?.name || 'User'}</span>
                  </motion.button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-[#181A20] border border-[#2B3139] rounded-lg shadow-lg z-50"
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm text-[#B7BDC6] border-b border-[#2B3139]">
                          <div className="font-medium text-[#EAECEF]">{effectiveUser?.name || 'User'}</div>
                          <div className="text-xs text-[#B7BDC6]">{effectiveUser?.email || 'user@example.com'}</div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-[#B7BDC6] hover:bg-[#2B3139] hover:text-[#EAECEF] transition-colors flex items-center space-x-2"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Login Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth/signin')}
                  className="flex items-center space-x-2 px-4 py-2 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#181A20] rounded-lg transition-colors"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:block">Sign In</span>
                </motion.button>

                {/* Register Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth/signup')}
                  className="bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-[#0B0E11] px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </motion.button>
              </>
            )}

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

              {/* Mobile Authentication Section */}
              {effectiveAuth ? (
                <div className="mt-4 pt-4 border-t border-[#1E2329]">
                  <div className="px-4 py-2 text-sm text-[#B7BDC6]">
                    <div className="font-medium text-[#EAECEF]">{effectiveUser?.name || 'User'}</div>
                    <div className="text-xs text-[#B7BDC6]">{effectiveUser?.email || 'user@example.com'}</div>
                  </div>
                  
                  {/* Mobile Notifications */}
                  <button
                    onClick={() => {
                      router.push('/user/notifications');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#B7BDC6] hover:bg-[#2B3139] hover:text-[#EAECEF] transition-colors flex items-center space-x-2"
                  >
                    <Bell size={16} />
                    <span>Notifications</span>
                    {notificationCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-[#B7BDC6] hover:bg-[#2B3139] hover:text-[#EAECEF] transition-colors flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-[#1E2329] space-y-2">
                  <button
                    onClick={() => {
                      router.push('/auth/signin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#B7BDC6] hover:bg-[#2B3139] hover:text-[#EAECEF] transition-colors flex items-center space-x-2"
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push('/auth/signup');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-[#0B0E11] px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}

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

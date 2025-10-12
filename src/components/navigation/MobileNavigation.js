/**
 * Enhanced Mobile Navigation
 * Modern mobile navigation with smooth animations
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  Wallet, 
  User, 
  Bell,
  Search,
  Settings,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Shield
} from 'lucide-react';
import { useTheme } from '../../lib/theme-context';
import ThemeToggle from '../design-system/ThemeToggle';

const MobileNavigation = ({ userRole = 'user', activeItem = 'dashboard' }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/user/dashboard' },
    { id: 'investment-plans', label: 'Investment Plans', icon: TrendingUp, path: '/plans' },
    { id: 'trading', label: 'Trading', icon: BarChart3, path: '/user/trade' },
    { id: 'portfolio', label: 'Portfolio', icon: TrendingUp, path: '/user/portfolio' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/user/wallet' },
    { id: 'charts', label: 'Charts', icon: BarChart3, path: '/user/charts' },
    { id: 'profile', label: 'Profile', icon: User, path: '/user/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/user/settings' }
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'trades', label: 'Trades', icon: BarChart3, path: '/admin/trades' },
    { id: 'deposits', label: 'Deposits', icon: DollarSign, path: '/admin/deposits' },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign, path: '/admin/withdrawals' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;
  const filteredItems = menuItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  const menuVariants = {
    hidden: { x: '-100%' },
    visible: { 
      x: 0,
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 200
      }
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

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu size={24} />
            </motion.button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Bitnex</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle size="sm" />
            <div className="relative">
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 lg:hidden shadow-xl"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Bitnex</span>
              </div>
              
              <motion.button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto">
              <div className="p-2">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;
                  
                  return (
                    <motion.a
                      key={item.id}
                      href={item.path}
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg mb-1
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                      `}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon 
                        size={20} 
                        className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} 
                      />
                      <span className="font-medium">{item.label}</span>
                    </motion.a>
                  );
                })}
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">John Doe</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userRole === 'admin' ? 'Administrator' : 'Trader'}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings size={16} />
                    <span className="text-sm font-medium">Settings</span>
                  </motion.button>
                  
                  <motion.button
                    className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Shield size={16} />
                    <span className="text-sm font-medium">Security</span>
                  </motion.button>
                </div>

                {/* Logout */}
                <motion.button
                  className="w-full flex items-center space-x-2 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-medium">Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;

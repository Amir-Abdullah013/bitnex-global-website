/**
 * Enhanced Sidebar Component
 * Modern sidebar with animations and responsive design
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  Wallet, 
  Settings, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  FileText
} from 'lucide-react';
import { useTheme } from '../../lib/theme-context';
import ThemeToggle from '../design-system/ThemeToggle';

const EnhancedSidebar = ({ 
  isCollapsed = false, 
  onToggle, 
  userRole = 'user',
  activeItem = 'dashboard' 
}) => {
  const { isDark } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

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

  const sidebarVariants = {
    expanded: { width: 256 },
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

  const tooltipVariants = {
    hidden: { opacity: 0, x: -10, scale: 0.8 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      className={`
        fixed left-0 top-0 h-full z-50
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        shadow-lg
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Bitnex</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <motion.a
                  href={item.path}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon 
                    size={20} 
                    className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} 
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

                {/* Tooltip for collapsed state */}
                <AnimatePresence>
                  {isCollapsed && hoveredItem === item.id && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={tooltipVariants}
                      className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50"
                    >
                        <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {item.label}
                        </div>
                      </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          {/* Notifications */}
          <motion.button
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
              text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Bell size={20} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium"
                >
                  Notifications
                </motion.span>
              )}
            </AnimatePresence>
            <div className="w-2 h-2 bg-red-500 rounded-full ml-auto"></div>
          </motion.button>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-gray-500 dark:text-gray-400"
                >
                  Theme
                </motion.span>
              )}
            </AnimatePresence>
            <ThemeToggle size="sm" />
          </div>

          {/* Logout */}
          <motion.button
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
              transition-all duration-200
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={20} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedSidebar;

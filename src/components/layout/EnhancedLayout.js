/**
 * Enhanced Layout Component
 * Modern layout with responsive design and smooth transitions
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../lib/theme-context';
import EnhancedSidebar from '../navigation/EnhancedSidebar';
import MobileNavigation from '../navigation/MobileNavigation';

const EnhancedLayout = ({ 
  children, 
  userRole = 'user',
  activeItem = 'dashboard',
  showSidebar = true 
}) => {
  const { isDark, mounted } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation 
          userRole={userRole} 
          activeItem={activeItem} 
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && showSidebar && (
        <EnhancedSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          userRole={userRole}
          activeItem={activeItem}
        />
      )}

      {/* Main Content */}
      <motion.main
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className={`
          transition-all duration-300 ease-in-out
          ${!isMobile && showSidebar 
            ? sidebarCollapsed 
              ? 'ml-16' 
              : 'ml-64' 
            : 'ml-0'
          }
          ${isMobile ? 'pt-16' : ''}
          min-h-screen
        `}
      >
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>
    </div>
  );
};

export default EnhancedLayout;



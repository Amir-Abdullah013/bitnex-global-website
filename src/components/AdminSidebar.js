'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const AdminSidebar = ({ adminUser }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const adminNavigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: '📊',
      description: 'Overview & Analytics'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: '👥',
      description: 'User Management'
    },
    {
      name: 'Transactions',
      href: '/admin/transactions',
      icon: '💳',
      description: 'All Transactions'
    },
    {
      name: 'Deposits',
      href: '/admin/deposits',
      icon: '💰',
      description: 'Deposit Requests'
    },
    {
      name: 'Withdrawals',
      href: '/admin/withdrawals',
      icon: '💸',
      description: 'Withdrawal Requests'
    },
    {
      name: 'Transfers',
      href: '/admin/transfers',
      icon: '🔄',
      description: 'Internal Transfers'
    },
    {
      name: 'Activity Logs',
      href: '/admin/logs',
      icon: '📋',
      description: 'System Activity'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: '⚙️',
      description: 'System Settings'
    }
  ];

  const isActive = (href) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-binance-surface text-binance-textPrimary rounded-lg border border-binance-border hover:bg-binance-surfaceHover transition-colors shadow-lg"
          aria-label="Toggle admin navigation menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block bg-binance-surface border-r border-binance-border transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } flex flex-col h-full`}>
        {/* Header */}
        <div className="p-4 border-b border-binance-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-binance-primary rounded-lg flex items-center justify-center">
                  <span className="text-binance-background font-bold text-sm">A</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-binance-textPrimary">Admin Panel</h2>
                  <p className="text-xs text-binance-textSecondary">Control Center</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-binance-textSecondary hover:text-binance-textPrimary hover:bg-binance-surfaceHover rounded-lg transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {adminNavigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-binance-primary/20 text-binance-primary border border-binance-primary/30'
                    : 'text-binance-textSecondary hover:text-binance-textPrimary hover:bg-binance-surfaceHover'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-binance-textTertiary">{item.description}</div>
                  </div>
                )}
                {active && !isCollapsed && (
                  <div className="w-2 h-2 bg-binance-primary rounded-full flex-shrink-0"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Info */}
        {!isCollapsed && (
          <div className="p-4 border-t border-binance-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-binance-primary/20 border border-binance-primary/30 rounded-full flex items-center justify-center">
                <span className="text-binance-primary text-sm font-semibold">
                  {adminUser?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-binance-textPrimary truncate">
                  {adminUser?.name || 'Admin'}
                </div>
                <div className="text-xs text-binance-textSecondary">Administrator</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 w-80 max-w-[85vw] bg-binance-surface border-r border-binance-border h-full z-50 transform transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-binance-border bg-binance-surface">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-binance-primary rounded-lg flex items-center justify-center">
              <span className="text-binance-background font-bold text-sm">A</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-binance-textPrimary">Admin Panel</h2>
              <p className="text-xs text-binance-textSecondary">Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-binance-textSecondary hover:text-binance-textPrimary hover:bg-binance-surfaceHover rounded-lg transition-colors"
            aria-label="Close admin navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          {adminNavigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-binance-primary/20 text-binance-primary border border-binance-primary/30'
                    : 'text-binance-textSecondary hover:text-binance-textPrimary hover:bg-binance-surfaceHover'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-binance-textTertiary">{item.description}</div>
                </div>
                {active && (
                  <div className="w-2 h-2 bg-binance-primary rounded-full flex-shrink-0"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Admin Info */}
        <div className="p-4 border-t border-binance-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-binance-primary/20 border border-binance-primary/30 rounded-full flex items-center justify-center">
              <span className="text-binance-primary text-sm font-semibold">
                {adminUser?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-binance-textPrimary truncate">
                {adminUser?.name || 'Admin'}
              </div>
              <div className="text-xs text-binance-textSecondary">Administrator</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
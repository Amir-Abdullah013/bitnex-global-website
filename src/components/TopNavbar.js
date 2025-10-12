'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './index';

const TopNavbar = ({ user, onSignOut }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);
  
  const mainNavigation = [
    { name: 'Markets', href: '/markets' },
    { name: 'Trade', href: '/user/trade' },
    { name: 'Wallet', href: '/user/wallet' },
    { name: 'Orders', href: '/user/orders' },
  ];
  
  if (!mounted) {
    return (
      <nav className="bg-binance-background border-b border-binance-border">
        <div className="max-w-full mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-binance-primary rounded flex items-center justify-center">
                  <span className="text-binance-background font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold text-binance-textPrimary">Bitnex Global</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="bg-binance-background border-b border-binance-border sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo and brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-binance-primary rounded flex items-center justify-center">
                <span className="text-binance-background font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-binance-textPrimary">Bitnex Global</span>
            </Link>
            
            {/* Main navigation */}
            {user && (
              <div className="hidden lg:flex items-center space-x-1">
                {mainNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-binance-primary bg-binance-surface'
                        : 'text-binance-textSecondary hover:text-binance-textPrimary hover:bg-binance-surface'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User profile dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded hover:bg-binance-surface transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-binance-primary flex items-center justify-center">
                      <span className="text-sm font-semibold text-binance-background">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm text-binance-textPrimary hidden md:block">{user.name}</span>
                    <svg className="h-4 w-4 text-binance-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-binance-surface rounded-lg shadow-xl border border-binance-border z-50">
                      <div className="py-1">
                        <div className="px-4 py-3 border-b border-binance-border">
                          <div className="text-sm font-medium text-binance-textPrimary">{user.name}</div>
                          <div className="text-xs text-binance-textSecondary mt-0.5">{user.email}</div>
                        </div>
                        
                        <Link
                          href="/user/dashboard"
                          className="block px-4 py-2.5 text-sm text-binance-textSecondary hover:bg-binance-surfaceHover hover:text-binance-textPrimary transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        
                        <Link
                          href="/user/profile"
                          className="block px-4 py-2.5 text-sm text-binance-textSecondary hover:bg-binance-surfaceHover hover:text-binance-textPrimary transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Profile Settings
                        </Link>
                        
                        {user.role === 'admin' && (
                          <Link
                            href="/admin/dashboard"
                            className="block px-4 py-2.5 text-sm text-binance-textSecondary hover:bg-binance-surfaceHover hover:text-binance-textPrimary transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        
                        <div className="border-t border-binance-border mt-1 pt-1">
                          <button
                            onClick={() => {
                              onSignOut();
                              setIsUserMenuOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2.5 text-sm text-binance-red hover:bg-binance-surfaceHover transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-1.5 rounded text-sm font-medium text-binance-textPrimary hover:bg-binance-surface transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-1.5 rounded text-sm font-semibold bg-binance-primary text-binance-background hover:opacity-90 transition-opacity"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;




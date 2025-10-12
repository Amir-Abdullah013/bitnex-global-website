'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import TopNavbar from './TopNavbar';
import BinanceSidebar from './BinanceSidebar';
import BnxStatusBar from './BnxStatusBar';
import { useAuth } from '../lib/auth-context';

const Layout = ({ children, showSidebar = true, fullWidth = false }) => {
  const { user, loading, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-binance-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-binance-primary"></div>
          <p className="text-binance-textSecondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-binance-background flex flex-col">
      {/* Top Navbar */}
      <TopNavbar user={user} onSignOut={handleSignOut} />
      
      {/* BNX Status Bar - Shows current balances and price */}
      {user && <BnxStatusBar />}

      <div className="flex flex-1">
        {/* Sidebar (desktop only) */}
        {showSidebar && user && (
          <BinanceSidebar user={user} />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 py-6`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

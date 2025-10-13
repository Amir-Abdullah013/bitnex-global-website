'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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

  // Removed loading check - render immediately for better UX
  // This prevents infinite loading when auth is stuck
  
  return (
    <div className="min-h-screen bg-binance-background flex flex-col">
      {/* BNX Status Bar - Shows current balances and price */}
      {user && <BnxStatusBar />}

      <div className="flex flex-1">
        {/* Sidebar (desktop only) */}
        {showSidebar && (
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

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import TopNavbar from './TopNavbar';
import AdminSidebar from './AdminSidebar';
import { useAdminAuth } from '../lib/admin-auth';

const AdminLayout = ({ children, showSidebar = true, fullWidth = false }) => {
  const { adminUser, loading, signOut } = useAdminAuth();
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
          <p className="text-binance-textSecondary text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-binance-background flex flex-col">
      {/* Top Navbar */}
      <TopNavbar user={adminUser} onSignOut={handleSignOut} />

      <div className="flex flex-1">
        {/* Admin Sidebar (desktop only) */}
        {showSidebar && adminUser && (
          <AdminSidebar adminUser={adminUser} />
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

export default AdminLayout;



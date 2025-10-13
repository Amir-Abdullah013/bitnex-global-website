'use client';

import { useState } from 'react';
import { Users, DollarSign, TrendingUp, BarChart3, Settings, Home, User, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function ReferralSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, path: '/user/referrals' },
    { id: 'referrals', label: 'My Referrals', icon: Users, path: '/user/referrals?tab=referrals' },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, path: '/user/referrals?tab=earnings' },
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/user/dashboard' },
    { id: 'profile', label: 'Profile', icon: User, path: '/user/profile' }
  ];

  const handleNavigation = (path) => {
    if (path.includes('?tab=')) {
      const [basePath, tab] = path.split('?tab=');
      if (basePath === pathname) {
        // If already on referrals page, just update the tab
        window.history.replaceState({}, '', `${pathname}?tab=${tab}`);
        // Trigger a custom event to update the tab
        window.dispatchEvent(new CustomEvent('referralTabChange', { detail: { tab } }));
      } else {
        router.push(path);
      }
    } else {
      router.push(path);
    }
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const isActive = (path) => {
    if (path === '/user/referrals') {
      return pathname === '/user/referrals' && !window.location.search.includes('tab=');
    }
    return pathname === path || (path.includes('?tab=') && pathname === '/user/referrals');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-[#1E2329] text-white rounded-lg border border-[#2B3139]"
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

      {/* Sidebar */}
      <div className={`w-64 bg-[#1E2329] border-r border-[#2B3139] min-h-screen fixed lg:static z-50 transform transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-[#FCD535] rounded-lg flex items-center justify-center">
            <span className="text-[#0B0E11] font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-bold text-white">Bitnex</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-[#FCD535] text-black'
                    : 'text-gray-400 hover:bg-[#2B3139] hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Referral Program Info */}
        <div className="mt-8 p-4 bg-[#0B0E11] rounded-lg border border-[#2B3139]">
          <h3 className="text-white font-semibold mb-2 text-sm">Referral Program</h3>
          <p className="text-gray-400 text-xs mb-3">
            Earn up to 10% commission by referring friends to Bitnex Global.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Level 1:</span>
              <span className="text-[#FCD535] font-medium">10%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Level 2:</span>
              <span className="text-[#FCD535] font-medium">5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Level 3:</span>
              <span className="text-[#FCD535] font-medium">2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Level 4:</span>
              <span className="text-[#FCD535] font-medium">1%</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

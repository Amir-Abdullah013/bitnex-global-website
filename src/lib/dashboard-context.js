'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Consolidated state
  const [usdBalance, setUsdBalance] = useState(0);
  const [bnxBalance, setBnxBalance] = useState(0);
  const [bnxPrice, setBnxPrice] = useState(0.0035);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    transactionCount: 0
  });
  const [quickStats, setQuickStats] = useState({
    totalTrades: 0,
    totalProfit: 0,
    activeOrders: 0,
    successRate: 0
  });

  // Load user data once when authenticated
  useEffect(() => {
    let isMounted = true;
    
    const loadUserData = async () => {
      if (!isAuthenticated || !user?.id) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
        }
        
        // Load user's wallet data
        const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
        if (response.ok && isMounted) {
          const data = await response.json();
          setUsdBalance(data.usdBalance || 0);
          setBnxBalance(data.bnxBalance || 0);
          setBnxPrice(data.bnxPrice || 0.0035);
        }

        // Load dashboard stats
        const statsResponse = await fetch(`/api/wallet/overview?userId=${user.id}`);
        if (statsResponse.ok && isMounted) {
          const statsData = await statsResponse.json();
          setDashboardStats({
            totalDeposits: statsData.statistics?.totalDeposits || 0,
            totalWithdrawals: statsData.statistics?.totalWithdrawals || 0,
            transactionCount: statsData.statistics?.transactionCount || 0
          });
        }

        // Load quick stats
        const quickStatsResponse = await fetch(`/api/user/quick-stats?userId=${user.id}`);
        if (quickStatsResponse.ok && isMounted) {
          const quickStatsData = await quickStatsResponse.json();
          setQuickStats({
            totalTrades: quickStatsData.totalTrades || 0,
            totalProfit: quickStatsData.totalProfit || 0,
            activeOrders: quickStatsData.activeOrders || 0,
            successRate: quickStatsData.successRate || 0
          });
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format BNX
  const formatBnx = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Buy BNX function
  const buyBnx = async (usdAmount) => {
    try {
      const response = await fetch('/api/trading/buy-bnx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          usdAmount: parseFloat(usdAmount) 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUsdBalance(prev => prev - parseFloat(usdAmount));
        setBnxBalance(prev => prev + result.tokensBought);
        setBnxPrice(result.newPrice);
      }
      
      return result;
    } catch (error) {
      console.error('Buy BNX error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Sell BNX function
  const sellBnx = async (bnxAmount) => {
    try {
      const response = await fetch('/api/trading/sell-bnx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          bnxAmount: parseFloat(bnxAmount) 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBnxBalance(prev => prev - parseFloat(bnxAmount));
        setUsdBalance(prev => prev + result.usdReceived);
        setBnxPrice(result.newPrice);
      }
      
      return result;
    } catch (error) {
      console.error('Sell BNX error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Fetch current price
  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch('/api/market/price');
      if (response.ok) {
        const data = await response.json();
        setBnxPrice(data.price || 0.0035);
      }
    } catch (error) {
      console.warn('Failed to fetch price:', error);
    }
  };

  const value = {
    // State
    usdBalance,
    bnxBalance,
    bnxPrice,
    isLoading,
    dashboardStats,
    quickStats,
    
    // Functions
    formatCurrency,
    formatBnx,
    buyBnx,
    sellBnx,
    fetchCurrentPrice
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

    'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';

const SimpleDashboardContext = createContext();

export const useSimpleDashboard = () => {
  const context = useContext(SimpleDashboardContext);
  if (!context) {
    throw new Error('useSimpleDashboard must be used within a SimpleDashboardProvider');
  }
  return context;
};

export const SimpleDashboardProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Simple state management
  const [usdBalance, setUsdBalance] = useState(0);
  const [bnxBalance, setBnxBalance] = useState(0);
  const [bnxPrice, setBnxPrice] = useState(0.0035);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Simple data loading function
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user?.id || hasLoaded) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Load wallet data
      const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUsdBalance(data.usdBalance || 0);
        setBnxBalance(data.bnxBalance || 0);
        setBnxPrice(data.bnxPrice || 0.0035);
      }
      
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, hasLoaded]);

  // Load data only once when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && !hasLoaded) {
      loadData();
    }
  }, [isAuthenticated, user?.id, hasLoaded, loadData]);

  // Format functions
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatBnx = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Simple trade functions
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

  const value = {
    usdBalance,
    bnxBalance,
    bnxPrice,
    isLoading,
    formatCurrency,
    formatBnx,
    buyBnx,
    sellBnx
  };

  return (
    <SimpleDashboardContext.Provider value={value}>
      {children}
    </SimpleDashboardContext.Provider>
  );
};

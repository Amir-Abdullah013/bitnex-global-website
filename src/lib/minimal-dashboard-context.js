'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

const MinimalDashboardContext = createContext();

export const useMinimalDashboard = () => {
  const context = useContext(MinimalDashboardContext);
  if (!context) {
    throw new Error('useMinimalDashboard must be used within a MinimalDashboardProvider');
  }
  return context;
};

export const MinimalDashboardProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Minimal state - only what's absolutely necessary
  const [usdBalance, setUsdBalance] = useState(0);
  const [bnxBalance, setBnxBalance] = useState(0);
  const [bnxPrice, setBnxPrice] = useState(0.0035);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Simple, stable data loading
  useEffect(() => {
    if (!isAuthenticated || !user?.id || dataLoaded) {
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUsdBalance(data.usdBalance || 0);
          setBnxBalance(data.bnxBalance || 0);
          setBnxPrice(data.bnxPrice || 0.0035);
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setDataLoaded(true); // Set to true even on error to prevent infinite loading
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user?.id, dataLoaded]);

  // Simple format functions
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
    <MinimalDashboardContext.Provider value={value}>
      {children}
    </MinimalDashboardContext.Provider>
  );
};

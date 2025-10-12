'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

const UniversalContext = createContext();

export const useUniversal = () => {
  const context = useContext(UniversalContext);
  if (!context) {
    throw new Error('useUniversal must be used within a UniversalProvider');
  }
  return context;
};

export const UniversalProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Simple state
  const [usdBalance, setUsdBalance] = useState(0);
  const [bnxBalance, setBnxBalance] = useState(0);
  const [bnxPrice, setBnxPrice] = useState(0.0035);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data once when authenticated with timeout protection
  useEffect(() => {
    if (isAuthenticated && user?.id && !dataLoaded) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          
          // Add timeout to prevent infinite loading
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn('UniversalContext: API call timed out after 5 seconds');
          }, 5000);
          
          const response = await fetch(`/api/wallet/balance?userId=${user.id}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            setUsdBalance(data.usdBalance || 0);
            setBnxBalance(data.bnxBalance || 0);
            setBnxPrice(data.bnxPrice || 0.0035);
          } else {
            console.error('UniversalContext: API response not ok:', response.status);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.warn('UniversalContext: API call aborted due to timeout');
          } else {
            console.error('UniversalContext: Error loading data:', error);
          }
        } finally {
          setIsLoading(false);
          setDataLoaded(true);
        }
      };
      
      loadData();
    } else if (!isAuthenticated) {
      setDataLoaded(true);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]); // Removed dataLoaded from dependencies

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

  // Trade functions
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
    <UniversalContext.Provider value={value}>
      {children}
    </UniversalContext.Provider>
  );
};

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

const BitnexContext = createContext();

export const useBitnex = () => {
  const context = useContext(BitnexContext);
  if (!context) {
    throw new Error('useBitnex must be used within a BitnexProvider');
  }
  return context;
};

export const BitnexProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Initial state values
  const [usdBalance, setUsdBalance] = useState(0);
  const [bnxBalance, setBnxBalance] = useState(0);
  const [bnxPrice, setBnxPrice] = useState(0.0035);
  const [isLoading, setIsLoading] = useState(true);

  // Load user-specific data from API
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Load user's wallet data from API
        const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
        let data = null;
        
        if (response.ok) {
          data = await response.json();
          setUsdBalance(data.usdBalance || 0);
          setBnxBalance(data.bnxBalance || 0);
          setBnxPrice(data.bnxPrice || 0.0035);
        } else {
        // Set default values if API fails
        setUsdBalance(0);
        setBnxBalance(0);
        setBnxPrice(0.0035);
        }
        
        console.log('✅ User data loaded:', {
          userId: user.id,
          usdBalance: data?.usdBalance || 0,
          bnxBalance: data?.bnxBalance || 0,
          bnxPrice: data?.bnxPrice || 0.0035
        });
        
      } catch (error) {
        console.error('Error loading user data:', error);
        // Set default values on error
        setUsdBalance(0);
        setBnxBalance(0);
        setBnxPrice(0.0035);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, user?.id]);

  // Currency conversion rates (simplified for demo)
  const currencyRates = {
    USD: 1,
    PKR: 0.0036, // 1 PKR = 0.0036 USD
    EUR: 1.08,   // 1 EUR = 1.08 USD
    GBP: 1.27,   // 1 GBP = 1.27 USD
    INR: 0.012,  // 1 INR = 0.012 USD
    CAD: 0.74,   // 1 CAD = 0.74 USD
    AUD: 0.66,   // 1 AUD = 0.66 USD
  };

  // Utility functions
  const convertToUSD = (amount, fromCurrency) => {
    const rate = currencyRates[fromCurrency] || 1;
    return amount * rate;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatBnx = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Update database via API
  const updateDatabaseBalances = async (newUsdBalance, newBnxBalance) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/wallet/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          usdBalance: newUsdBalance,
          bnxBalance: newBnxBalance
        }),
      });
      
      if (response.ok) {
        console.log('✅ Database balances updated:', {
          userId: user.id,
          usdBalance: newUsdBalance,
          bnxBalance: newBnxBalance
        });
      }
    } catch (error) {
      console.error('Error updating database balances:', error);
    }
  };

  // Trading functions
  const depositUSD = async (amount, currency = 'USD') => {
    if (!user?.id) return 0;
    
    const usdAmount = convertToUSD(amount, currency);
    const newBalance = usdBalance + usdAmount;
    
    setUsdBalance(newBalance);
    await updateDatabaseBalances(newBalance, bnxBalance);
    
    return usdAmount;
  };

  const withdrawUSD = async (amount) => {
    if (!user?.id || amount > usdBalance) return false;
    
    const newBalance = usdBalance - amount;
    setUsdBalance(newBalance);
    await updateDatabaseBalances(newBalance, bnxBalance);
    
    return true;
  };

  const buyBnx = async (usdAmount) => {
    if (!user?.id || usdAmount > usdBalance) {
      return { success: false, error: 'Insufficient USD balance' };
    }

    try {
      // Call the buy API to get real-time price calculation
      const response = await fetch('/api/bnx/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          usdAmount: usdAmount
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update balances based on API response
        const newUsdBalance = usdBalance - usdAmount;
        const newBnxBalance = bnxBalance + data.transaction.tokensReceived;
        
        setUsdBalance(newUsdBalance);
        setBnxBalance(newBnxBalance);
        
        // Update database
        await updateDatabaseBalances(newUsdBalance, newBnxBalance);
        
        // Update price with the new calculated price
        setBnxPrice(data.priceUpdate.newPrice);
        
        return { 
          success: true, 
          tokensBought: data.transaction.tokensReceived,
          newPrice: data.priceUpdate.newPrice,
          oldPrice: data.priceUpdate.oldPrice
        };
      } else {
        return { success: false, error: data.error || 'Buy failed' };
      }
    } catch (error) {
      console.error('Buy API error:', error);
      // Fallback to local calculation
      const tokensToBuy = usdAmount / bnxPrice;
      const priceIncrease = usdAmount / 1000000;
      
      const newUsdBalance = usdBalance - usdAmount;
      const newBnxBalance = bnxBalance + tokensToBuy;
      
      setUsdBalance(newUsdBalance);
      setBnxBalance(newBnxBalance);
      setBnxPrice(Math.min(1, bnxPrice + priceIncrease));
      
      // Update database
      await updateDatabaseBalances(newUsdBalance, newBnxBalance);
      
      return { success: true, tokensBought: tokensToBuy };
    }
  };

  const sellBnx = async (tokenAmount) => {
    if (!user?.id || tokenAmount > bnxBalance) {
      return { success: false, error: 'Insufficient BNX balance' };
    }

    try {
      // Call the sell API to get real-time price calculation
      const response = await fetch('/api/bnx/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          tokenAmount: tokenAmount
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update balances based on API response
        const newBnxBalance = bnxBalance - tokenAmount;
        const newUsdBalance = usdBalance + data.transaction.amount;
        
        setTikiBalance(newBnxBalance);
        setUsdBalance(newUsdBalance);
        
        // Update database
        await updateDatabaseBalances(newUsdBalance, newBnxBalance);
        
        // Update price with the new calculated price
        setBnxPrice(data.priceUpdate.newPrice);
        
        return { 
          success: true, 
          usdReceived: data.transaction.amount,
          newPrice: data.priceUpdate.newPrice,
          oldPrice: data.priceUpdate.oldPrice
        };
      } else {
        return { success: false, error: data.error || 'Sell failed' };
      }
    } catch (error) {
      console.error('Sell API error:', error);
      // Fallback to local calculation
      const usdReceived = tokenAmount * bnxPrice;
      const priceDecrease = usdReceived / 1000000;
      
      const newBnxBalance = bnxBalance - tokenAmount;
      const newUsdBalance = usdBalance + usdReceived;
      
      setTikiBalance(newBnxBalance);
      setUsdBalance(newUsdBalance);
      setBnxPrice(Math.max(0.0001, bnxPrice - priceDecrease));
      
      // Update database
      await updateDatabaseBalances(newUsdBalance, newBnxBalance);
      
      return { success: true, usdReceived };
    }
  };

  const getCurrencies = () => Object.keys(currencyRates);

  // Fetch current price from API
  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch('/api/price', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.price) {
        setBnxPrice(data.price);
        // Store in localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('bnxPrice', data.price.toString());
        }
        return data.price;
      } else {
        console.warn('Price API returned unsuccessful response:', data);
        return getFallbackPrice();
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
      return getFallbackPrice();
    }
  };

  // Get fallback price from localStorage or default
  const getFallbackPrice = () => {
    if (typeof window !== 'undefined') {
      const storedPrice = localStorage.getItem('bnxPrice');
      if (storedPrice) {
        const price = parseFloat(storedPrice);
        if (!isNaN(price)) {
          setBnxPrice(price);
          return price;
        }
      }
    }
    // Default fallback price
    const defaultPrice = 0.0035;
    setBnxPrice(defaultPrice);
    return defaultPrice;
  };

  const value = {
    // State values
    usdBalance,
    bnxBalance,
    bnxPrice,
    isLoading,
    
    // State setters
    setUsdBalance,
    setBnxBalance,
    setBnxPrice,
    
    // Trading functions
    depositUSD,
    withdrawUSD,
    buyBnx,
    sellBnx,
    
    // Utility functions
    convertToUSD,
    formatCurrency,
    formatBnx,
    getCurrencies,
    fetchCurrentPrice,
    currencyRates
  };

  return (
    <BitnexContext.Provider value={value}>
      {children}
    </BitnexContext.Provider>
  );
};
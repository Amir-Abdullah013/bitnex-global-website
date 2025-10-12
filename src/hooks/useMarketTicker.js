/**
 * Market Ticker Hook
 * Optimized hook for managing market ticker data with performance optimizations
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { connectToMultipleSymbols, disconnectFromAllSymbols } from '../lib/binanceSocket';

const useMarketTicker = (symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']) => {
  const [tickerData, setTickerData] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  
  const connectionIdRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Memoize symbols to prevent unnecessary reconnections
  const memoizedSymbols = useMemo(() => symbols, [symbols.join(',')]);

  // Throttled update function to prevent excessive re-renders
  const throttledUpdate = useCallback((data) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setTickerData(prevData => {
          const newData = new Map(prevData);
          newData.set(data.symbol, {
            ...data,
            lastUpdate: Date.now()
          });
          return newData;
        });
        setLastUpdate(Date.now());
        setError(null);
      }
    }, 100); // Throttle updates to 100ms
  }, []);

  // Initialize ticker data
  useEffect(() => {
    const initialData = new Map();
    memoizedSymbols.forEach(symbol => {
      // Extract base asset properly (e.g., BTCUSDT -> BTC, ETHBTC -> ETH)
      let baseAsset = symbol;
      if (symbol.endsWith('USDT')) {
        baseAsset = symbol.slice(0, -4); // Remove last 4 chars (USDT)
      } else if (symbol.endsWith('BTC')) {
        baseAsset = symbol.slice(0, -3); // Remove last 3 chars (BTC)
      } else if (symbol.endsWith('ETH')) {
        baseAsset = symbol.slice(0, -3); // Remove last 3 chars (ETH)
      }
      
      initialData.set(symbol, {
        symbol,
        baseAsset,
        quoteAsset: symbol.endsWith('USDT') ? 'USDT' : symbol.endsWith('BTC') ? 'BTC' : 'ETH',
        lastPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        volume: 0,
        high24h: 0,
        low24h: 0,
        isPositive: true,
        formattedPrice: '0.00',
        formattedChange: '0.00',
        formattedVolume: '0',
        isLoading: true,
        lastUpdate: null
      });
    });
    setTickerData(initialData);
  }, [memoizedSymbols]);

  // Connect to WebSocket
  useEffect(() => {
    if (!memoizedSymbols.length) return;

    const handlePriceUpdate = (data) => {
      throttledUpdate(data);
    };

    const handleError = (error) => {
      console.error('Market ticker error:', error);
      setError(error.message || 'Connection error');
    };

    try {
      connectionIdRef.current = connectToMultipleSymbols(memoizedSymbols, handlePriceUpdate);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      handleError(err);
    }

    return () => {
      if (connectionIdRef.current) {
        disconnectFromAllSymbols();
        setIsConnected(false);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [memoizedSymbols, throttledUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Get specific symbol data
  const getSymbolData = useCallback((symbol) => {
    return tickerData.get(symbol) || null;
  }, [tickerData]);

  // Get all symbols data as array
  const getAllSymbolsData = useCallback(() => {
    return Array.from(tickerData.values());
  }, [tickerData]);

  // Get symbols with positive change
  const getPositiveChangeSymbols = useCallback(() => {
    return Array.from(tickerData.values()).filter(data => data.isPositive);
  }, [tickerData]);

  // Get symbols with negative change
  const getNegativeChangeSymbols = useCallback(() => {
    return Array.from(tickerData.values()).filter(data => !data.isPositive);
  }, [tickerData]);

  // Get top gainers
  const getTopGainers = useCallback((limit = 5) => {
    return Array.from(tickerData.values())
      .filter(data => data.isPositive)
      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
      .slice(0, limit);
  }, [tickerData]);

  // Get top losers
  const getTopLosers = useCallback((limit = 5) => {
    return Array.from(tickerData.values())
      .filter(data => !data.isPositive)
      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
      .slice(0, limit);
  }, [tickerData]);

  // Get total market cap (simplified calculation)
  const getTotalMarketCap = useCallback(() => {
    return Array.from(tickerData.values()).reduce((total, data) => {
      return total + (data.lastPrice * data.volume);
    }, 0);
  }, [tickerData]);

  // Check if data is stale (older than 30 seconds)
  const isDataStale = useCallback(() => {
    if (!lastUpdate) return true;
    return Date.now() - lastUpdate > 30000;
  }, [lastUpdate]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (connectionIdRef.current) {
      disconnectFromAllSymbols();
    }
    
    try {
      connectionIdRef.current = connectToMultipleSymbols(memoizedSymbols, throttledUpdate);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Reconnection failed');
    }
  }, [memoizedSymbols, throttledUpdate]);

  return {
    // Data
    tickerData,
    isConnected,
    lastUpdate,
    error,
    
    // Helper functions
    getSymbolData,
    getAllSymbolsData,
    getPositiveChangeSymbols,
    getNegativeChangeSymbols,
    getTopGainers,
    getTopLosers,
    getTotalMarketCap,
    isDataStale,
    
    // Actions
    reconnect,
    
    // Status
    isLoading: !isConnected && !error,
    hasError: !!error,
    isStale: isDataStale()
  };
};

export default useMarketTicker;



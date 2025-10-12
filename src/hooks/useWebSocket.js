'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketClient from '../lib/websocket-client';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    socketId: null,
    reconnectAttempts: 0
  });
  const [orderBook, setOrderBook] = useState({ buyOrders: [], sellOrders: [] });
  const [recentTrades, setRecentTrades] = useState([]);
  const [priceData, setPriceData] = useState({
    price: 0,
    change24h: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0
  });
  const [userOrders, setUserOrders] = useState([]);
  const [newTrades, setNewTrades] = useState([]);
  const [chartData, setChartData] = useState([]);

  const listenersRef = useRef(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = webSocketClient.connect();
    
    // Set up connection status listener
    const handleConnectionStatus = (status) => {
      setIsConnected(status.connected);
      setConnectionStatus(prev => ({
        ...prev,
        connected: status.connected,
        reason: status.reason
      }));
    };

    // Set up order book listener
    const handleOrderBookUpdate = (data) => {
      setOrderBook(data.orderBook);
    };

    // Set up trades listener
    const handleTradesUpdate = (data) => {
      setRecentTrades(data.trades);
    };

    // Set up price listener
    const handlePriceUpdate = (data) => {
      setPriceData({
        price: data.price,
        change24h: data.change24h,
        volume24h: data.volume24h,
        high24h: data.high24h,
        low24h: data.low24h
      });
    };

    // Set up new trade listener
    const handleNewTrade = (data) => {
      setNewTrades(prev => [data.trade, ...prev.slice(0, 49)]); // Keep last 50 trades
      setRecentTrades(prev => [data.trade, ...prev.slice(0, 19)]); // Keep last 20 in recent trades
    };

    // Set up chart data listener
    const handleChartDataUpdate = (data) => {
      setChartData(data.data);
    };

    // Set up new candle listener
    const handleNewCandle = (data) => {
      setChartData(prev => [...prev.slice(1), data.candle]); // Add new candle, remove oldest
    };

    // Set up user orders listener
    const handleUserOrderUpdate = (data) => {
      setUserOrders(prev => {
        const existingIndex = prev.findIndex(order => order.id === data.order.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = data.order;
          return updated;
        } else {
          return [data.order, ...prev];
        }
      });
    };

    // Add listeners
    webSocketClient.on('connection-status', handleConnectionStatus);
    webSocketClient.on('orderbook-update', handleOrderBookUpdate);
    webSocketClient.on('trades-update', handleTradesUpdate);
    webSocketClient.on('price-update', handlePriceUpdate);
    webSocketClient.on('new-trade', handleNewTrade);
    webSocketClient.on('user-order-update', handleUserOrderUpdate);
    webSocketClient.on('chart-data-update', handleChartDataUpdate);
    webSocketClient.on('new-candle', handleNewCandle);

    // Store listeners for cleanup
    listenersRef.current.set('connection-status', handleConnectionStatus);
    listenersRef.current.set('orderbook-update', handleOrderBookUpdate);
    listenersRef.current.set('trades-update', handleTradesUpdate);
    listenersRef.current.set('price-update', handlePriceUpdate);
    listenersRef.current.set('new-trade', handleNewTrade);
    listenersRef.current.set('user-order-update', handleUserOrderUpdate);

    return () => {
      // Clean up listeners
      listenersRef.current.forEach((listener, event) => {
        webSocketClient.off(event, listener);
      });
      listenersRef.current.clear();
    };
  }, []);

  // Subscribe to order book updates
  const subscribeToOrderBook = useCallback((tradingPair = 'BNX/USD') => {
    try {
      webSocketClient.subscribeToOrderBook(tradingPair);
    } catch (error) {
      console.error('Error subscribing to order book:', error);
    }
  }, []);

  // Subscribe to trades updates
  const subscribeToTrades = useCallback((tradingPair = 'BNX/USD') => {
    try {
      webSocketClient.subscribeToTrades(tradingPair);
    } catch (error) {
      console.error('Error subscribing to trades:', error);
    }
  }, []);

  // Subscribe to price updates
  const subscribeToPrice = useCallback((symbol = 'BNX') => {
    try {
      webSocketClient.subscribeToPrice(symbol);
    } catch (error) {
      console.error('Error subscribing to price:', error);
    }
  }, []);

  // Subscribe to user order updates
  const subscribeToUserOrders = useCallback((userId) => {
    try {
      webSocketClient.subscribeToUserOrders(userId);
    } catch (error) {
      console.error('Error subscribing to user orders:', error);
    }
  }, []);

  // Subscribe to chart data updates
  const subscribeToChart = useCallback((symbol, timeframe) => {
    try {
      webSocketClient.subscribeToChart(symbol, timeframe);
    } catch (error) {
      console.error('Error subscribing to chart data:', error);
    }
  }, []);

  // Join trading room
  const joinTradingRoom = useCallback((tradingPair = 'BNX/USD') => {
    try {
      webSocketClient.joinTradingRoom(tradingPair);
    } catch (error) {
      console.error('Error joining trading room:', error);
    }
  }, []);

  // Unsubscribe functions
  const unsubscribeFromOrderBook = useCallback((tradingPair = 'BNX/USD') => {
    try {
      webSocketClient.unsubscribeFromOrderBook(tradingPair);
    } catch (error) {
      console.error('Error unsubscribing from order book:', error);
    }
  }, []);

  const unsubscribeFromTrades = useCallback((tradingPair = 'BNX/USD') => {
    try {
      webSocketClient.unsubscribeFromTrades(tradingPair);
    } catch (error) {
      console.error('Error unsubscribing from trades:', error);
    }
  }, []);

  const unsubscribeFromPrice = useCallback((symbol = 'BNX') => {
    try {
      webSocketClient.unsubscribeFromPrice(symbol);
    } catch (error) {
      console.error('Error unsubscribing from price:', error);
    }
  }, []);

  const unsubscribeFromUserOrders = useCallback((userId) => {
    try {
      webSocketClient.unsubscribeFromUserOrders(userId);
    } catch (error) {
      console.error('Error unsubscribing from user orders:', error);
    }
  }, []);

  // Unsubscribe from chart data
  const unsubscribeFromChart = useCallback((symbol, timeframe) => {
    try {
      webSocketClient.unsubscribeFromChart(symbol, timeframe);
    } catch (error) {
      console.error('Error unsubscribing from chart data:', error);
    }
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return webSocketClient.getConnectionStatus();
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    webSocketClient.disconnect();
  }, []);

  return {
    // Connection status
    isConnected,
    connectionStatus,
    
    // Data
    orderBook,
    recentTrades,
    priceData,
    userOrders,
    newTrades,
    chartData,
    
    // Subscription methods
    subscribeToOrderBook,
    subscribeToTrades,
    subscribeToPrice,
    subscribeToUserOrders,
    subscribeToChart,
    joinTradingRoom,
    
    // Unsubscribe methods
    unsubscribeFromOrderBook,
    unsubscribeFromTrades,
    unsubscribeFromPrice,
    unsubscribeFromUserOrders,
    unsubscribeFromChart,
    
    // Utility methods
    getConnectionStatus,
    disconnect
  };
};

// Hook for order book specifically
export const useOrderBook = (tradingPair = 'BNX/USDT') => {
  const { orderBook, subscribeToOrderBook, unsubscribeFromOrderBook, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      subscribeToOrderBook(tradingPair);
    }

    return () => {
      unsubscribeFromOrderBook(tradingPair);
    };
  }, [isConnected, tradingPair, subscribeToOrderBook, unsubscribeFromOrderBook]);

  return { orderBook, isConnected };
};

// Hook for trades specifically
export const useTrades = (tradingPair = 'BNX/USDT') => {
  const { recentTrades, newTrades, subscribeToTrades, unsubscribeFromTrades, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      subscribeToTrades(tradingPair);
    }

    return () => {
      unsubscribeFromTrades(tradingPair);
    };
  }, [isConnected, tradingPair, subscribeToTrades, unsubscribeFromTrades]);

  return { recentTrades, newTrades, isConnected };
};

// Hook for price specifically
export const usePrice = (symbol = 'BNX') => {
  const { priceData, subscribeToPrice, unsubscribeFromPrice, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      subscribeToPrice(symbol);
    }

    return () => {
      unsubscribeFromPrice(symbol);
    };
  }, [isConnected, symbol, subscribeToPrice, unsubscribeFromPrice]);

  return { priceData, isConnected };
};

// Hook for user orders specifically
export const useUserOrders = (userId) => {
  const { userOrders, subscribeToUserOrders, unsubscribeFromUserOrders, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected && userId) {
      subscribeToUserOrders(userId);
    }

    return () => {
      if (userId) {
        unsubscribeFromUserOrders(userId);
      }
    };
  }, [isConnected, userId, subscribeToUserOrders, unsubscribeFromUserOrders]);

  return { userOrders, isConnected };
};

// Hook for chart data specifically
export const useChartData = (symbol = 'BNX', timeframe = '1h') => {
  const { chartData, subscribeToChart, unsubscribeFromChart, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      subscribeToChart(symbol, timeframe);
    }

    return () => {
      unsubscribeFromChart(symbol, timeframe);
    };
  }, [isConnected, symbol, timeframe, subscribeToChart, unsubscribeFromChart]);

  return { chartData, isConnected };
};

export default useWebSocket;

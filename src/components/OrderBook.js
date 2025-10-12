'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import { useOrderBook, useTrades } from '../hooks/useWebSocket';
import { useTradingPair } from '../lib/trading-pair-context';

const OrderBook = ({ className = '', maxOrders = 10 }) => {
  const { selectedPair, getPairAssets } = useTradingPair();
  const { orderBook: wsOrderBook, isConnected: orderBookConnected } = useOrderBook(selectedPair);
  const { recentTrades: wsRecentTrades, isConnected: tradesConnected } = useTrades(selectedPair);
  const [orderBook, setOrderBook] = useState({ buyOrders: [], sellOrders: [] });
  const [recentTrades, setRecentTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update local state when WebSocket data changes
  useEffect(() => {
    if (wsOrderBook && wsOrderBook.buyOrders && wsOrderBook.sellOrders) {
      setOrderBook(wsOrderBook);
    }
  }, [wsOrderBook]);

  useEffect(() => {
    if (wsRecentTrades) {
      setRecentTrades(wsRecentTrades);
    }
  }, [wsRecentTrades]);

  useEffect(() => {
    // Set loading to false once we have data or connection is established
    if (orderBookConnected || tradesConnected) {
      setIsLoading(false);
    }
  }, [orderBookConnected, tradesConnected]);

  // Fallback to API if WebSocket is not connected
  useEffect(() => {
    if (!orderBookConnected && !tradesConnected) {
      fetchOrderBook();
      fetchRecentTrades();
    }
  }, [orderBookConnected, tradesConnected, selectedPair]);

  // API calls for fallback
  const fetchOrderBook = async () => {
    try {
      const response = await fetch(`/api/orders/orderbook?tradingPair=${selectedPair}&limit=${maxOrders}`);
      const data = await response.json();

      if (data.success) {
        setOrderBook(data.orderBook);
        setError(null);
      } else {
        console.warn('Failed to fetch order book:', data.error);
        // Set empty order book instead of error
        setOrderBook({ buyOrders: [], sellOrders: [] });
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching order book:', err);
      // Set empty order book instead of error
      setOrderBook({ buyOrders: [], sellOrders: [] });
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const response = await fetch(`/api/orders/trades?tradingPair=${selectedPair}&limit=20`);
      const data = await response.json();

      if (data.success) {
        setRecentTrades(data.trades);
      } else {
        console.warn('Failed to fetch recent trades:', data.error);
        // Set empty trades instead of error
        setRecentTrades([]);
      }
    } catch (err) {
      console.error('Error fetching recent trades:', err);
      // Set empty trades instead of error
      setRecentTrades([]);
    }
  };

  // Retry function for error state
  const handleRetry = async () => {
    setError(null);
    setIsLoading(true);
    await fetchOrderBook();
    await fetchRecentTrades();
  };

  // Format price for display
  const formatPrice = (price) => {
    return price ? `$${price.toFixed(4)}` : 'Market';
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format total value
  const formatTotal = (amount, price) => {
    const total = amount * (price || 0);
    return `$${total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Get price change color
  const getPriceChangeColor = (price, index, isBuy) => {
    if (isBuy) {
      return 'text-binance-green';
    } else {
      return 'text-binance-red';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Order Book</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-binance-surface rounded w-20"></div>
                  <div className="h-4 bg-binance-surface rounded w-16"></div>
                  <div className="h-4 bg-binance-surface rounded w-24"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Order Book</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-binance-red text-sm">{error}</div>
              <button
                onClick={handleRetry}
                className="mt-2 text-binance-primary hover:text-binance-primary/80 text-sm"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Order Book */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sell Orders (Red) */}
            <div>
              <div className="text-xs text-binance-textSecondary mb-2 font-medium">
                SELL ORDERS
              </div>
              <div className="space-y-1">
                {orderBook.sellOrders.slice(0, maxOrders).map((order, index) => (
                  <div
                    key={`sell-${order.id}`}
                    className="flex justify-between items-center py-1 px-2 rounded hover:bg-binance-surfaceHover transition-colors"
                  >
                    <span className="text-sm text-binance-red font-medium">
                      {formatPrice(order.price)}
                    </span>
                    <span className="text-sm text-binance-textPrimary">
                      {formatAmount(order.amount)}
                    </span>
                    <span className="text-sm text-binance-textSecondary">
                      {formatTotal(order.amount, order.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spread */}
            {orderBook.buyOrders.length > 0 && orderBook.sellOrders.length > 0 && (
              <div className="border-t border-b border-binance-border py-2">
                <div className="text-center">
                  <div className="text-xs text-binance-textTertiary mb-1">Spread</div>
                  <div className="text-sm font-medium text-binance-textPrimary">
                    {formatPrice(orderBook.sellOrders[0]?.price - orderBook.buyOrders[0]?.price)}
                  </div>
                </div>
              </div>
            )}

            {/* Buy Orders (Green) */}
            <div>
              <div className="text-xs text-binance-textSecondary mb-2 font-medium">
                BUY ORDERS
              </div>
              <div className="space-y-1">
                {orderBook.buyOrders.slice(0, maxOrders).map((order, index) => (
                  <div
                    key={`buy-${order.id}`}
                    className="flex justify-between items-center py-1 px-2 rounded hover:bg-binance-surfaceHover transition-colors"
                  >
                    <span className="text-sm text-binance-green font-medium">
                      {formatPrice(order.price)}
                    </span>
                    <span className="text-sm text-binance-textPrimary">
                      {formatAmount(order.amount)}
                    </span>
                    <span className="text-sm text-binance-textSecondary">
                      {formatTotal(order.amount, order.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentTrades.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-binance-textTertiary text-sm">No recent trades</div>
              </div>
            ) : (
              recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex justify-between items-center py-2 px-3 rounded hover:bg-binance-surfaceHover transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      trade.side === 'BUY' ? 'bg-binance-green' : 'bg-binance-red'
                    }`}></div>
                    <div>
                      <div className="text-sm text-binance-textPrimary">
                        {formatAmount(trade.amount)} BNX
                      </div>
                      <div className="text-xs text-binance-textTertiary">
                        {new Date(trade.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      trade.side === 'BUY' ? 'text-binance-green' : 'text-binance-red'
                    }`}>
                      {formatPrice(trade.price)}
                    </div>
                    <div className="text-xs text-binance-textSecondary">
                      {formatTotal(trade.amount, trade.price)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderBook;

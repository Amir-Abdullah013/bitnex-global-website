'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/Card';
import Button from '../../components/Button';
import WebSocketStatus from '../../components/WebSocketStatus';
import { useWebSocket } from '../../hooks/useWebSocket';

const TestWebSocketPage = () => {
  const { 
    isConnected, 
    orderBook, 
    recentTrades, 
    priceData, 
    newTrades,
    subscribeToOrderBook,
    subscribeToTrades,
    subscribeToPrice,
    joinTradingRoom
  } = useWebSocket();

  const [testMessages, setTestMessages] = useState([]);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (isConnected) {
      // Subscribe to all real-time data
      subscribeToOrderBook('BNX/USD');
      subscribeToTrades('BNX/USD');
      subscribeToPrice('BNX');
      joinTradingRoom('BNX/USD');
    }
  }, [isConnected, subscribeToOrderBook, subscribeToTrades, subscribeToPrice, joinTradingRoom]);

  // Monitor for new trades
  useEffect(() => {
    if (newTrades.length > 0) {
      const latestTrade = newTrades[0];
      setTestMessages(prev => [{
        id: Date.now(),
        type: 'new-trade',
        message: `New trade: ${latestTrade.amount} BNX @ $${latestTrade.price}`,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
      setMessageCount(prev => prev + 1);
    }
  }, [newTrades]);

  // Monitor for order book changes
  useEffect(() => {
    if (orderBook.buyOrders.length > 0 || orderBook.sellOrders.length > 0) {
      setTestMessages(prev => [{
        id: Date.now(),
        type: 'orderbook-update',
        message: `Order book updated: ${orderBook.buyOrders.length} buy orders, ${orderBook.sellOrders.length} sell orders`,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
      setMessageCount(prev => prev + 1);
    }
  }, [orderBook]);

  // Monitor for price changes
  useEffect(() => {
    if (priceData.price > 0) {
      setTestMessages(prev => [{
        id: Date.now(),
        type: 'price-update',
        message: `Price updated: $${priceData.price.toFixed(4)} (${priceData.change24h >= 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%)`,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
      setMessageCount(prev => prev + 1);
    }
  }, [priceData]);

  const clearMessages = () => {
    setTestMessages([]);
    setMessageCount(0);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'new-trade':
        return 'text-binance-green';
      case 'orderbook-update':
        return 'text-binance-primary';
      case 'price-update':
        return 'text-binance-textPrimary';
      default:
        return 'text-binance-textSecondary';
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-binance-textPrimary">WebSocket Test Page</h1>
              <p className="text-binance-textSecondary mt-2">
                Test real-time updates between multiple browser sessions
              </p>
            </div>
            <WebSocketStatus />
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-binance-textPrimary">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isConnected ? 'text-binance-green' : 'text-binance-red'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                  <div className="text-sm text-binance-textSecondary">WebSocket Status</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-binance-textPrimary">
                    {messageCount}
                  </div>
                  <div className="text-sm text-binance-textSecondary">Messages Received</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-binance-textPrimary">
                    {orderBook.buyOrders.length + orderBook.sellOrders.length}
                  </div>
                  <div className="text-sm text-binance-textSecondary">Order Book Orders</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-binance-textPrimary">
                    {recentTrades.length}
                  </div>
                  <div className="text-sm text-binance-textSecondary">Recent Trades</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Messages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-binance-textPrimary">Real-time Messages</CardTitle>
                <Button size="sm" variant="outline" onClick={clearMessages}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-binance-textTertiary">No messages yet</div>
                    <div className="text-binance-textSecondary text-sm mt-1">
                      Open another browser tab to test real-time updates
                    </div>
                  </div>
                ) : (
                  testMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between py-2 px-3 rounded hover:bg-binance-surfaceHover transition-colors"
                    >
                      <div>
                        <div className={`text-sm font-medium ${getMessageColor(message.type)}`}>
                          {message.message}
                        </div>
                        <div className="text-xs text-binance-textTertiary">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                      <div className="text-xs text-binance-textTertiary">
                        {message.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-binance-textPrimary">Current Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Price Data */}
                <div>
                  <h4 className="text-binance-textPrimary font-semibold mb-2">Price Data</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-binance-textSecondary">Current Price:</span>
                      <span className="text-binance-textPrimary">
                        ${priceData.price.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-binance-textSecondary">24h Change:</span>
                      <span className={priceData.change24h >= 0 ? 'text-binance-green' : 'text-binance-red'}>
                        {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-binance-textSecondary">24h Volume:</span>
                      <span className="text-binance-textPrimary">
                        ${priceData.volume24h.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Book Summary */}
                <div>
                  <h4 className="text-binance-textPrimary font-semibold mb-2">Order Book</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-binance-textSecondary">Buy Orders:</span>
                      <span className="text-binance-green">
                        {orderBook.buyOrders.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-binance-textSecondary">Sell Orders:</span>
                      <span className="text-binance-red">
                        {orderBook.sellOrders.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Trades */}
                <div>
                  <h4 className="text-binance-textPrimary font-semibold mb-2">Recent Trades</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-binance-textSecondary">Total Trades:</span>
                      <span className="text-binance-textPrimary">
                        {recentTrades.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-binance-textSecondary">New Trades:</span>
                      <span className="text-binance-textPrimary">
                        {newTrades.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-binance-textPrimary">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-binance-textPrimary font-semibold mb-2">How to Test Real-time Updates:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-binance-textSecondary">
                    <li>Open this page in two different browser tabs or windows</li>
                    <li>Navigate to the trading page in one tab</li>
                    <li>Place a buy or sell order</li>
                    <li>Watch the real-time messages appear in both tabs</li>
                    <li>Check that order book and trade data updates simultaneously</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="text-binance-textPrimary font-semibold mb-2">What to Look For:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-binance-textSecondary">
                    <li>Order book updates when new orders are placed</li>
                    <li>New trade notifications when orders are matched</li>
                    <li>Price updates in real-time</li>
                    <li>Connection status indicators</li>
                    <li>Message timestamps showing live updates</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TestWebSocketPage;



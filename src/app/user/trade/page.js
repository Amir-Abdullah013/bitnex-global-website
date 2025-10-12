'use client';

import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import OrderBook from '../../../components/OrderBook';
import TradingInterface from '../../../components/TradingInterface';
import LiveTrades from '../../../components/LiveTrades';
import TradingPairSelector from '../../../components/TradingPairSelector';
import { useUniversal } from '../../../lib/universal-context';
import { TradingPairProvider, useTradingPair } from '../../../lib/trading-pair-context';
import SafeLoader from '../../../components/SafeLoader';
import { useLoadingManager } from '../../../hooks/useLoadingManager';

const TradePageContent = () => {
  const { bnxPrice, formatCurrency } = useUniversal();
  const { selectedPair, getCurrentPairData, getPairAssets } = useTradingPair();
  const [marketData, setMarketData] = useState({
    price: 0,
    change24h: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0
  });
  // Safe loading management
  const { isLoading: safeLoading, stopLoading } = useLoadingManager(true, 5000);

  const fetchMarketData = async () => {
    try {
      const { baseAsset } = getPairAssets();
      const response = await fetch(`/api/price?symbol=${baseAsset}`);
      const data = await response.json();
      
      if (data.success) {
        setMarketData({
          price: data.price,
          change24h: data.change24h || 0,
          volume24h: data.volume24h || 0,
          high24h: data.high24h || data.price,
          low24h: data.low24h || data.price
        });
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      // Always stop loading after first fetch
      stopLoading();
    }
  };

  // Fetch market data on mount and when pair changes
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  const getPriceChangeColor = () => {
    return marketData.change24h >= 0 ? 'text-binance-green' : 'text-binance-red';
  };

  const getPriceChangeIcon = () => {
    return marketData.change24h >= 0 ? '↗' : '↘';
  };

  // Safe loading with timeout protection
  if (safeLoading) {
    return (
      <Layout showSidebar={true}>
        <SafeLoader isLoading={true} text="Loading market data..." timeout={5000}>
          <div>Trading interface will load here...</div>
        </SafeLoader>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-binance-textPrimary">BNX Trading</h1>
          <p className="text-binance-textSecondary mt-2">Trade BNX tokens with advanced order matching</p>
              </div>

        {/* Market Overview */}
        <div className="mb-8">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-binance-textPrimary">
                    {formatCurrency(marketData.price, 'USD')}
              </div>
                  <div className="text-sm text-binance-textSecondary">Current Price</div>
            </div>
                
                <div className="text-center">
                  <div className={`text-lg font-semibold ${getPriceChangeColor()}`}>
                    {getPriceChangeIcon()} {Math.abs(marketData.change24h).toFixed(2)}%
          </div>
                  <div className="text-sm text-binance-textSecondary">24h Change</div>
        </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-binance-textPrimary">
                    {formatCurrency(marketData.volume24h, 'USD')}
              </div>
                  <div className="text-sm text-binance-textSecondary">24h Volume</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-binance-green">
                    {formatCurrency(marketData.high24h, 'USD')}
              </div>
                  <div className="text-sm text-binance-textSecondary">24h High</div>
        </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-binance-red">
                    {formatCurrency(marketData.low24h, 'USD')}
                  </div>
                  <div className="text-sm text-binance-textSecondary">24h Low</div>
                </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Trading Pair Selector */}
        <div className="mb-6">
          <TradingPairSelector />
        </div>

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Order Book */}
          <div className="lg:col-span-1">
            <OrderBook maxOrders={8} />
          </div>

          {/* Center Column - Trading Interface */}
          <div className="lg:col-span-1">
            <TradingInterface />
          </div>

          {/* Right Column - Live Trades */}
          <div className="lg:col-span-1">
            <LiveTrades maxTrades={15} />
          </div>

          {/* Market Info Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Market Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-binance-textPrimary">Market Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-binance-textSecondary">Market Cap:</span>
                    <span className="text-binance-textPrimary font-medium">
                      {formatCurrency(marketData.price * 100000000, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-binance-textSecondary">Total Supply:</span>
                    <span className="text-binance-textPrimary font-medium">
                      100,000,000 BNX
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-binance-textSecondary">Circulating:</span>
                    <span className="text-binance-textPrimary font-medium">
                      100,000,000 BNX
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-binance-textSecondary">Last Updated:</span>
                    <span className="text-binance-textPrimary font-medium">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-binance-textPrimary">Trading Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-binance-primary">💡</span>
                    <span className="text-binance-textSecondary">
                      Use limit orders for better price control
                    </span>
                </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-binance-primary">💡</span>
                    <span className="text-binance-textSecondary">
                      Market orders execute immediately at current price
                    </span>
          </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-binance-primary">💡</span>
                    <span className="text-binance-textSecondary">
                      Monitor the order book for liquidity
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-binance-primary">💡</span>
                    <span className="text-binance-textSecondary">
                      Orders are matched automatically
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
                    </div>
                  </div>

        {/* Trading Rules */}
        <div className="mt-8">
              <Card>
                <CardHeader>
              <CardTitle className="text-binance-textPrimary">Trading Rules & Information</CardTitle>
                </CardHeader>
                <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                  <h4 className="text-binance-textPrimary font-semibold mb-3">Order Types</h4>
                  <ul className="space-y-2 text-sm text-binance-textSecondary">
                    <li><strong>Market Orders:</strong> Execute immediately at current market price</li>
                    <li><strong>Limit Orders:</strong> Execute only at your specified price or better</li>
                    <li><strong>Partial Fills:</strong> Orders can be filled partially over time</li>
                  </ul>
                    </div>
                    <div>
                  <h4 className="text-binance-textPrimary font-semibold mb-3">Trading Fees</h4>
                  <ul className="space-y-2 text-sm text-binance-textSecondary">
                    <li><strong>Trading Fee:</strong> 0.1% per trade</li>
                    <li><strong>Withdrawal Fee:</strong> 0.0005 BNX</li>
                    <li><strong>Deposit Fee:</strong> Free</li>
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

const TradePage = () => {
  return (
    <TradingPairProvider>
      <TradePageContent />
    </TradingPairProvider>
  );
};

export default TradePage;
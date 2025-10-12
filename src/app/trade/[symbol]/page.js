/**
 * Individual Coin Trading Page
 * Dynamic route for trading specific cryptocurrencies
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Activity,
  BarChart3,
  DollarSign,
  Volume2
} from 'lucide-react';
import { connectToSymbolStreams, disconnectFromSymbolStreams } from '../../../lib/binanceStreams';
import MarketTicker from '../../../components/MarketTicker';
import OrderBook from '../../../components/trading/OrderBook';
import PriceChart from '../../../components/trading/PriceChart';
import TradingForm from '../../../components/trading/TradingForm';
import Button from '../../../components/design-system/Button';
import { Grid, Flex, Stack } from '../../../components/design-system/Grid';
import { Heading, Text, Badge } from '../../../components/design-system/Typography';

const CoinTradingPage = () => {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol?.toUpperCase() || 'BTCUSDT';
  
  // State for market data
  const [tickerData, setTickerData] = useState({
    symbol: symbol,
    lastPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    volume: 0,
    high24h: 0,
    low24h: 0,
    isPositive: true
  });
  
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
    spread: 0,
    spreadPercent: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  
  // WebSocket connection
  const [connectionId, setConnectionId] = useState(null);

  // Connect to WebSocket streams
  useEffect(() => {
    const callbacks = {
      onTicker: (data) => {
        setTickerData(data);
        setLastUpdate(Date.now());
        setError(null);
      },
      onDepth: (data) => {
        setOrderBook(data);
        setLastUpdate(Date.now());
      },
      onKline: (data) => {
        setChartData(prev => {
          const newData = [...prev];
          const existingIndex = newData.findIndex(item => item.openTime === data.openTime);
          
          if (existingIndex >= 0) {
            newData[existingIndex] = data;
          } else {
            newData.push(data);
          }
          
          // Keep only last 100 candles
          return newData.slice(-100);
        });
        setLastUpdate(Date.now());
      },
      onTrade: (data) => {
        setRecentTrades(prev => {
          const newTrades = [data, ...prev];
          return newTrades.slice(0, 20); // Keep only last 20 trades
        });
        setLastUpdate(Date.now());
      }
    };

    try {
      const connId = connectToSymbolStreams(symbol.toLowerCase(), callbacks);
      setConnectionId(connId);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    }

    return () => {
      if (connectionId) {
        disconnectFromSymbolStreams(connectionId);
      }
    };
  }, [symbol]);

  // Handle trade execution
  const handleTrade = async (tradeData) => {
    try {
      // Here you would integrate with your existing trading API
      console.log('Executing trade:', tradeData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message or redirect
      alert(`Trade executed successfully! ${tradeData.side} ${tradeData.amount} ${symbol.replace('USDT', '')}`);
    } catch (error) {
      console.error('Trade execution error:', error);
      alert('Trade execution failed. Please try again.');
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 4 
      });
    } else {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 8 
      });
    }
  };

  const getPriceColor = () => {
    return tickerData.isPositive ? '#0ECB81' : '#F6465D';
  };

  const getChangeIcon = () => {
    return tickerData.isPositive ? TrendingUp : TrendingDown;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-[#181A20]">
      {/* Market Ticker */}
      <MarketTicker 
        symbols={['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT']}
        className="sticky top-0 z-40"
      />

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-4 space-y-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
              className="border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]"
            >
              Back
            </Button>
            
            <div>
              <Heading size="xl" className="text-[#EAECEF]">
                {symbol.replace('USDT', '/USDT')}
              </Heading>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-[#EAECEF]">
                    ${formatPrice(tickerData.lastPrice)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getChangeIcon() && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.3 }}
                      >
                        {React.createElement(getChangeIcon(), { 
                          size: 16, 
                          style: { color: getPriceColor() } 
                        })}
                      </motion.div>
                    )}
                    <span 
                      className="text-sm font-medium"
                      style={{ color: getPriceColor() }}
                    >
                      {tickerData.priceChange >= 0 ? '+' : ''}{tickerData.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-[#B7BDC6]">
                  <div className="flex items-center space-x-1">
                    <Volume2 size={14} />
                    <span>Vol: {tickerData.volume.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 size={14} />
                    <span>24h High: ${formatPrice(tickerData.high24h)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 size={14} />
                    <span>24h Low: ${formatPrice(tickerData.low24h)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
            <span className="text-sm text-[#B7BDC6]">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={16} />}
              onClick={() => window.location.reload()}
              className="border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]"
            >
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-[#F6465D]/10 border border-[#F6465D]/20 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-sm text-[#F6465D]">
                <Activity size={16} />
                <span>Connection Error: {error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column - Order Book */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <OrderBook 
              symbol={symbol}
              maxOrders={15}
              showSpread={true}
            />
          </motion.div>

          {/* Center Column - Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-6">
            <PriceChart 
              symbol={symbol}
              defaultTimeframe="1h"
              showVolume={true}
              showIndicators={true}
            />
          </motion.div>

          {/* Right Column - Trading Form */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <TradingForm 
              symbol={symbol}
              currentPrice={tickerData.lastPrice}
              onTrade={handleTrade}
            />
          </motion.div>
        </div>

        {/* Recent Trades */}
        <motion.div variants={itemVariants} className="bg-[#1E2329] rounded-lg border border-[#2B3139]">
          <div className="p-4 border-b border-[#2B3139]">
            <Heading size="lg" className="text-[#EAECEF]">Recent Trades</Heading>
          </div>
          
          <div className="p-4">
            <div className="space-y-2">
              {recentTrades.map((trade, index) => (
                <motion.div
                  key={`${trade.tradeId}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2 rounded hover:bg-[#2B3139] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${trade.isBuyerMaker ? 'bg-[#F6465D]/20' : 'bg-[#0ECB81]/20'}`}>
                      {trade.isBuyerMaker ? (
                        <TrendingDown size={12} className="text-[#F6465D]" />
                      ) : (
                        <TrendingUp size={12} className="text-[#0ECB81]" />
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-[#EAECEF]">
                        {formatPrice(trade.price)}
                      </div>
                      <div className="text-xs text-[#B7BDC6]">
                        {trade.quantity.toFixed(4)} {symbol.replace('USDT', '')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-[#B7BDC6]">
                      {new Date(trade.time).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CoinTradingPage;

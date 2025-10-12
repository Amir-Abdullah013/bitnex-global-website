/**
 * Live Price Chart Component
 * Real-time candlestick chart with multiple timeframes
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Activity,
  Settings
} from 'lucide-react';

const PriceChart = ({ 
  symbol = 'BTCUSDT',
  defaultTimeframe = '1h',
  showVolume = true,
  showIndicators = true,
  className = ''
}) => {
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const timeframes = [
    { id: '1m', label: '1m', interval: '1m' },
    { id: '5m', label: '5m', interval: '5m' },
    { id: '15m', label: '15m', interval: '15m' },
    { id: '1h', label: '1h', interval: '1h' },
    { id: '4h', label: '4h', interval: '4h' },
    { id: '1d', label: '1d', interval: '1d' }
  ];

  // Memoized chart data for performance
  const processedChartData = useMemo(() => {
    return chartData.map((candle, index) => ({
      ...candle,
      time: new Date(candle.openTime).toLocaleTimeString(),
      date: new Date(candle.openTime).toLocaleDateString(),
      timestamp: candle.openTime,
      index
    }));
  }, [chartData]);

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

  const formatVolume = (volume) => {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    } else {
      return volume.toFixed(2);
    }
  };

  const getPriceColor = () => {
    return priceChange >= 0 ? '#0ECB81' : '#F6465D';
  };

  const getChangeIcon = () => {
    return priceChange >= 0 ? TrendingUp : TrendingDown;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`
        bg-[#1E2329] rounded-lg border border-[#2B3139]
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2B3139]">
        <div className="flex items-center space-x-3">
          <BarChart3 size={20} className="text-[#F0B90B]" />
          <div>
            <h3 className="text-lg font-semibold text-[#EAECEF]">
              {symbol.replace('USDT', '/USDT')}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-[#EAECEF]">
                ${formatPrice(currentPrice)}
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
                  {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
          <span className="text-xs text-[#B7BDC6]">
            {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
          </span>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between p-4 border-b border-[#2B3139]">
        <div className="flex space-x-1">
          {timeframes.map((tf) => (
            <motion.button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`
                px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${timeframe === tf.id
                  ? 'bg-[#F0B90B] text-[#181A20]'
                  : 'bg-[#2B3139] text-[#B7BDC6] hover:bg-[#3C4043] hover:text-[#EAECEF]'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tf.label}
            </motion.button>
          ))}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-[#B7BDC6]">
          <div className="flex items-center space-x-1">
            <Activity size={14} />
            <span>Vol: {formatVolume(volume)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{timeframe}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedChartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getPriceColor()} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={getPriceColor()} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis 
                dataKey="time" 
                stroke="#B7BDC6"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={['dataMin', 'dataMax']}
                stroke="#B7BDC6"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatPrice(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2329',
                  border: '1px solid #2B3139',
                  borderRadius: '8px',
                  color: '#EAECEF'
                }}
                labelStyle={{ color: '#EAECEF' }}
                formatter={(value, name) => [
                  formatPrice(value),
                  name === 'close' ? 'Price' : name
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={getPriceColor()}
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: getPriceColor() }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Info */}
      <div className="p-4 border-t border-[#2B3139]">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-[#B7BDC6]">24h High</div>
            <div className="text-[#EAECEF] font-medium">
              ${formatPrice(Math.max(...chartData.map(d => d.high)))}
            </div>
          </div>
          <div>
            <div className="text-[#B7BDC6]">24h Low</div>
            <div className="text-[#EAECEF] font-medium">
              ${formatPrice(Math.min(...chartData.map(d => d.low)))}
            </div>
          </div>
          <div>
            <div className="text-[#B7BDC6]">24h Volume</div>
            <div className="text-[#EAECEF] font-medium">
              {formatVolume(volume)}
            </div>
          </div>
          <div>
            <div className="text-[#B7BDC6]">Last Update</div>
            <div className="text-[#EAECEF] font-medium">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceChart;


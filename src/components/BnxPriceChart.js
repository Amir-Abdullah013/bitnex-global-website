'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { useUniversal } from '../lib/universal-context';
import { usePrice } from '../hooks/useWebSocket';
import { useTradingPair } from '../lib/trading-pair-context';

// Time filter options
const TIME_FILTERS = [
  { label: '1M', value: '1min', hours: 1/60 },
  { label: '1H', value: '1h', hours: 1 },
  { label: '1D', value: '1d', hours: 24 },
  { label: '7D', value: '7d', hours: 168 },
  { label: '30D', value: '30d', hours: 720 }
];

// Generate BNX price data based on current price
const generateBnxData = (timeFilter, currentPrice) => {
  const now = new Date();
  const data = [];
  const points = 50; // Number of data points
  
  let startTime;
  let interval;
  
  switch (timeFilter) {
    case '1min':
      startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      interval = 60 * 1000; // 1 minute intervals
      break;
    case '1h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      interval = 24 * 60 * 1000; // 1 hour intervals
      break;
    case '1d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      interval = 7 * 24 * 60 * 1000; // 1 day intervals
      break;
    case '7d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      interval = 30 * 24 * 60 * 1000; // 7 day intervals
      break;
    case '30d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      interval = 90 * 24 * 60 * 60 * 1000; // 30 day intervals
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 7 * 24 * 60 * 1000;
  }
  
  // Start with a price slightly lower than current for historical data
  let basePrice = currentPrice * 0.8;
  
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startTime.getTime() + (i * interval));
    
    // Generate realistic price movement with smaller volatility for BNX
    const volatility = 0.01; // 1% volatility for BNX
    const change = (Math.random() - 0.5) * volatility;
    basePrice = basePrice * (1 + change);
    
    // Ensure price stays within reasonable bounds (0.5x to 2x current price)
    const minPrice = currentPrice * 0.5;
    const maxPrice = currentPrice * 2;
    basePrice = Math.max(minPrice, Math.min(maxPrice, basePrice));
    
    data.push({
      timestamp: timestamp.toISOString(),
      price: parseFloat(basePrice.toFixed(4)), // More precision for BNX
      volume: Math.floor(Math.random() * 10000000) + 1000000, // Higher volume for crypto
      time: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      date: timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    });
  }
  
  // Ensure the last point is close to current price
  if (data.length > 0) {
    data[data.length - 1].price = currentPrice;
  }
  
  return data;
};

// Custom tooltip component for BNX
const BnxTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-binance-surface p-3 border border-binance-border rounded-lg shadow-lg">
        <p className="text-xs text-binance-textSecondary mb-1">
          {data.date} {data.time}
        </p>
        <p className="text-base font-semibold text-binance-textPrimary">
          ${data.price.toFixed(4)}
        </p>
        <p className="text-xs text-binance-textTertiary">
          Volume: {data.volume.toLocaleString()} BNX
        </p>
      </div>
    );
  }
  return null;
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-binance-surface rounded"></div>
  </div>
);

const BnxPriceChart = ({ className = '' }) => {
  const { bnxPrice, formatCurrency } = useUniversal();
  const { selectedPair, getPairAssets } = useTradingPair();
  const { baseAsset } = getPairAssets();
  const { priceData, isConnected } = usePrice(baseAsset);
  const [selectedFilter, setSelectedFilter] = useState('1d');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(bnxPrice);
  const [priceChange, setPriceChange] = useState(0);

  // Use real-time price data
  useEffect(() => {
    if (priceData.price > 0) {
      setCurrentPrice(priceData.price);
      setPriceChange(priceData.change24h || 0);
    }
  }, [priceData]);

  // Generate data when filter changes or BNX price changes
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const data = generateBnxData(selectedFilter, bnxPrice);
      setChartData(data);
      
      if (data.length > 0) {
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        setCurrentPrice(latest.price);
        setPriceChange(latest.price - previous.price);
      }
      
      setIsLoading(false);
    }, 500);
  }, [selectedFilter, bnxPrice]);

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  // Get price change color
  const getPriceChangeColor = () => {
    return priceChange >= 0 ? 'text-binance-green' : 'text-binance-red';
  };

  // Get price change icon
  const getPriceChangeIcon = () => {
    return priceChange >= 0 ? '📈' : '📉';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-binance-textPrimary">BNX Price Chart</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-binance-textSecondary">Time Range:</span>
              <div className="flex space-x-1">
                {TIME_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={selectedFilter === filter.value ? 'primary' : 'outline'}
                    onClick={() => handleFilterChange(filter.value)}
                    className={`text-xs px-2 py-1 ${
                      selectedFilter === filter.value
                        ? 'bg-binance-primary text-binance-background'
                        : 'text-binance-textSecondary hover:bg-binance-surface'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Current Price Display */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-binance-textSecondary">Current BNX Price</p>
                <p className="text-2xl font-bold text-binance-textPrimary">
                  {formatCurrency(currentPrice, 'USD')}
                </p>
              </div>
              <div className="text-right">
                <div className={`flex items-center text-sm ${getPriceChangeColor()}`}>
                  <span className="mr-1">{getPriceChangeIcon()}</span>
                  <span>
                    {priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange, 'USD')} 
                    ({((priceChange / (currentPrice - priceChange)) * 100).toFixed(2)}%)
                  </span>
                </div>
                <p className="text-xs text-binance-textTertiary">
                  {selectedFilter === '1min' ? 'Last hour' :
                   selectedFilter === '1h' ? 'Last 24 hours' :
                   selectedFilter === '1d' ? 'Last 7 days' :
                   selectedFilter === '7d' ? 'Last 30 days' :
                   'Last 90 days'}
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                  <XAxis 
                    dataKey="time"
                    stroke="#848E9C"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#848E9C"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toFixed(4)}`}
                  />
                  <Tooltip content={<BnxTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#FCD535"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#FCD535' }}
                  />
                  <ReferenceLine 
                    y={currentPrice} 
                    stroke="#0ECB81" 
                    strokeDasharray="2 2"
                    strokeOpacity={0.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart Info */}
          <div className="mt-4 flex items-center justify-between text-xs text-binance-textTertiary">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-binance-primary rounded-full mr-2"></div>
                <span className="text-binance-textSecondary">BNX Price</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-binance-green rounded-full mr-2" style={{ opacity: 0.5 }}></div>
                <span className="text-binance-textSecondary">Current</span>
              </div>
            </div>
            <div className="text-binance-textSecondary">
              {chartData.length} data points
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BnxPriceChart;










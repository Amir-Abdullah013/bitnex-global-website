import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Chart Data Service
 * Handles fetching and processing of historical price data for charts
 */
class ChartDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Get cached data or fetch from database
   */
  async getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Generate synthetic OHLCV data for a given timeframe
   */
  generateSyntheticData(symbol, timeframe, limit = 500) {
    const data = [];
    const now = new Date();
    const intervalMs = this.getIntervalMs(timeframe);
    
    // Start from limit intervals ago
    const startTime = new Date(now.getTime() - (limit * intervalMs));
    
    // Base price for the symbol
    const basePrice = this.getBasePrice(symbol);
    let currentPrice = basePrice;
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(startTime.getTime() + (i * intervalMs));
      
      // Generate realistic price movement
      const volatility = this.getVolatility(symbol, timeframe);
      const change = (Math.random() - 0.5) * volatility;
      const newPrice = currentPrice * (1 + change);
      
      // Generate OHLCV data
      const open = currentPrice;
      const close = newPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({
        time: Math.floor(timestamp.getTime() / 1000), // Unix timestamp
        open: parseFloat(open.toFixed(8)),
        high: parseFloat(high.toFixed(8)),
        low: parseFloat(low.toFixed(8)),
        close: parseFloat(close.toFixed(8)),
        volume: volume
      });
      
      currentPrice = close;
    }
    
    return data;
  }

  /**
   * Get interval in milliseconds for timeframe
   */
  getIntervalMs(timeframe) {
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000
    };
    return intervals[timeframe] || intervals['1h'];
  }

  /**
   * Get base price for symbol
   */
  getBasePrice(symbol) {
    const basePrices = {
      'BNX': 0.5,
      'BTC': 45000,
      'ETH': 3000,
      'USDT': 1.0
    };
    return basePrices[symbol] || 1.0;
  }

  /**
   * Get volatility for symbol and timeframe
   */
  getVolatility(symbol, timeframe) {
    const symbolVolatility = {
      'BNX': 0.05,
      'BTC': 0.03,
      'ETH': 0.04,
      'USDT': 0.001
    };
    
    const timeframeMultiplier = {
      '1m': 0.1,
      '5m': 0.2,
      '15m': 0.3,
      '1h': 0.5,
      '4h': 0.8,
      '1d': 1.0,
      '1w': 1.5
    };
    
    return (symbolVolatility[symbol] || 0.02) * (timeframeMultiplier[timeframe] || 1.0);
  }

  /**
   * Fetch historical data from database
   */
  async fetchHistoricalData(symbol, timeframe, limit = 500) {
    try {
      // Check cache first
      const cacheKey = `${symbol}-${timeframe}-${limit}`;
      const cached = await this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Calculate time range based on timeframe
      const intervalMs = this.getIntervalMs(timeframe);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (limit * intervalMs));

      // Try to fetch from MarketData table
      const marketData = await prisma.marketData.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: startTime,
            lte: endTime
          }
        },
        orderBy: {
          timestamp: 'asc'
        },
        take: limit
      });

      if (marketData.length > 0) {
        // Convert database data to chart format
        const chartData = marketData.map(data => ({
          time: Math.floor(data.timestamp.getTime() / 1000),
          open: parseFloat(data.open),
          high: parseFloat(data.high),
          low: parseFloat(data.low),
          close: parseFloat(data.close),
          volume: parseFloat(data.volume)
        }));

        this.setCachedData(cacheKey, chartData);
        return chartData;
      }

      // If no data in database, generate synthetic data
      const syntheticData = this.generateSyntheticData(symbol, timeframe, limit);
      this.setCachedData(cacheKey, syntheticData);
      return syntheticData;

    } catch (error) {
      console.error('Error fetching historical data:', error);
      
      // Fallback to synthetic data
      const syntheticData = this.generateSyntheticData(symbol, timeframe, limit);
      return syntheticData;
    }
  }

  /**
   * Get latest price data
   */
  async getLatestPrice(symbol) {
    try {
      const latest = await prisma.price.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' }
      });

      if (latest) {
        return {
          price: parseFloat(latest.price),
          change24h: parseFloat(latest.change24h || 0),
          volume24h: parseFloat(latest.volume24h || 0),
          timestamp: latest.timestamp
        };
      }

      // Fallback to base price
      return {
        price: this.getBasePrice(symbol),
        change24h: 0,
        volume24h: 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching latest price:', error);
      return {
        price: this.getBasePrice(symbol),
        change24h: 0,
        volume24h: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Calculate technical indicators
   */
  calculateIndicators(data, indicators = ['EMA', 'RSI', 'MACD']) {
    const result = {};

    if (indicators.includes('EMA')) {
      result.EMA = this.calculateEMA(data, [9, 21, 50]);
    }

    if (indicators.includes('RSI')) {
      result.RSI = this.calculateRSI(data, 14);
    }

    if (indicators.includes('MACD')) {
      result.MACD = this.calculateMACD(data, 12, 26, 9);
    }

    if (indicators.includes('SMA')) {
      result.SMA = this.calculateSMA(data, [20, 50, 200]);
    }

    if (indicators.includes('BB')) {
      result.BB = this.calculateBollingerBands(data, 20, 2);
    }

    return result;
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(data, periods) {
    const result = {};
    
    periods.forEach(period => {
      const ema = [];
      const multiplier = 2 / (period + 1);
      
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          ema.push(data[i].close);
        } else {
          const value = (data[i].close * multiplier) + (ema[i - 1] * (1 - multiplier));
          ema.push(value);
        }
      }
      
      result[`EMA${period}`] = ema;
    });
    
    return result;
  }

  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(data, periods) {
    const result = {};
    
    periods.forEach(period => {
      const sma = [];
      
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          sma.push(null);
        } else {
          const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
          sma.push(sum / period);
        }
      }
      
      result[`SMA${period}`] = sma;
    });
    
    return result;
  }

  /**
   * Calculate RSI
   */
  calculateRSI(data, period = 14) {
    const rsi = [];
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
    
    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        rsi.push(null);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
    
    return rsi;
  }

  /**
   * Calculate MACD
   */
  calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(data, [fastPeriod])[`EMA${fastPeriod}`];
    const slowEMA = this.calculateEMA(data, [slowPeriod])[`EMA${slowPeriod}`];
    
    const macdLine = [];
    const signalLine = [];
    
    for (let i = 0; i < data.length; i++) {
      if (fastEMA[i] && slowEMA[i]) {
        macdLine.push(fastEMA[i] - slowEMA[i]);
      } else {
        macdLine.push(null);
      }
    }
    
    // Calculate signal line (EMA of MACD)
    const signalEMA = this.calculateEMA(
      macdLine.filter(v => v !== null).map(v => ({ close: v })), 
      [signalPeriod]
    )[`EMA${signalPeriod}`];
    
    let signalIndex = 0;
    for (let i = 0; i < macdLine.length; i++) {
      if (macdLine[i] !== null && signalIndex < signalEMA.length) {
        signalLine.push(signalEMA[signalIndex]);
        signalIndex++;
      } else {
        signalLine.push(null);
      }
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine.map((macd, i) => 
        macd !== null && signalLine[i] !== null ? macd - signalLine[i] : null
      )
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(data, period = 20, stdDev = 2) {
    const sma = this.calculateSMA(data, [period])[`SMA${period}`];
    const upperBand = [];
    const lowerBand = [];
    
    for (let i = 0; i < data.length; i++) {
      if (sma[i] !== null && i >= period - 1) {
        const slice = data.slice(i - period + 1, i + 1);
        const variance = slice.reduce((acc, item) => 
          acc + Math.pow(item.close - sma[i], 2), 0
        ) / period;
        const standardDeviation = Math.sqrt(variance);
        
        upperBand.push(sma[i] + (stdDev * standardDeviation));
        lowerBand.push(sma[i] - (stdDev * standardDeviation));
      } else {
        upperBand.push(null);
        lowerBand.push(null);
      }
    }
    
    return {
      upper: upperBand,
      middle: sma,
      lower: lowerBand
    };
  }

  /**
   * Get market statistics
   */
  async getMarketStats(symbol) {
    try {
      const stats = await prisma.marketData.aggregate({
        where: { symbol },
        _max: { high: true, timestamp: true },
        _min: { low: true },
        _sum: { volume: true },
        _count: { id: true }
      });

      const latest = await this.getLatestPrice(symbol);

      return {
        high24h: parseFloat(stats._max.high || 0),
        low24h: parseFloat(stats._min.low || 0),
        volume24h: parseFloat(stats._sum.volume || 0),
        trades24h: stats._count.id || 0,
        currentPrice: latest.price,
        change24h: latest.change24h
      };
    } catch (error) {
      console.error('Error fetching market stats:', error);
      return {
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        trades24h: 0,
        currentPrice: this.getBasePrice(symbol),
        change24h: 0
      };
    }
  }

  /**
   * Clean up cache
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const chartDataService = new ChartDataService();

// Clean up cache every 5 minutes
setInterval(() => {
  chartDataService.cleanupCache();
}, 5 * 60 * 1000);

export default chartDataService;


/**
 * Cache Service for Bitnex Global
 * High-performance caching for prices, order book, and frequently accessed data
 * Supports both Redis and in-memory fallback
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // TTL (Time To Live) in seconds
  PRICE_TTL: 5, // 5 seconds for price data
  ORDER_BOOK_TTL: 1, // 1 second for order book
  TRADES_TTL: 10, // 10 seconds for recent trades
  USER_DATA_TTL: 300, // 5 minutes for user data
  MARKET_STATS_TTL: 60, // 1 minute for market statistics
  CHART_DATA_TTL: 30, // 30 seconds for chart data
  
  // Cache keys
  KEYS: {
    PRICE: (symbol) => `price:${symbol}`,
    ORDER_BOOK: (pair) => `orderbook:${pair}`,
    RECENT_TRADES: (pair) => `trades:${pair}`,
    USER_BALANCE: (userId) => `user:${userId}:balance`,
    USER_ORDERS: (userId) => `user:${userId}:orders`,
    MARKET_STATS: (symbol) => `market:${symbol}:stats`,
    CHART_DATA: (symbol, timeframe) => `chart:${symbol}:${timeframe}`,
    TRADING_PAIRS: 'trading:pairs',
    FEE_STRUCTURES: 'fees:structures'
  }
};

/**
 * In-memory cache fallback
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      return null;
    }
    
    return item.value;
  }

  async set(key, value, ttl = null) {
    const item = {
      value,
      expiresAt: ttl ? Date.now() + (ttl * 1000) : null
    };
    
    this.cache.set(key, item);
    
    if (ttl) {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }
      
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);
      
      this.timers.set(key, timer);
    }
    
    return true;
  }

  async del(key) {
    const deleted = this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return deleted;
  }

  async exists(key) {
    return this.cache.has(key);
  }

  async flush() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  async keys(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }
}

/**
 * Redis cache implementation
 */
class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Try to import and connect to Redis
      const redis = await import('redis');
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.warn('Redis connection refused, falling back to memory cache');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.warn('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Redis not available, using memory cache:', error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected || !this.client) return false;
    
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  async keys(pattern) {
    if (!this.isConnected || !this.client) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }
}

// Initialize cache (Redis with memory fallback)
const redisCache = new RedisCache();
const memoryCache = new MemoryCache();

// Use Redis if available, otherwise fall back to memory cache
const cache = {
  async get(key) {
    if (redisCache.isConnected) {
      return await redisCache.get(key);
    }
    return await memoryCache.get(key);
  },

  async set(key, value, ttl = null) {
    if (redisCache.isConnected) {
      return await redisCache.set(key, value, ttl);
    }
    return await memoryCache.set(key, value, ttl);
  },

  async del(key) {
    if (redisCache.isConnected) {
      return await redisCache.del(key);
    }
    return await memoryCache.del(key);
  },

  async exists(key) {
    if (redisCache.isConnected) {
      return await redisCache.exists(key);
    }
    return await memoryCache.exists(key);
  },

  async flush() {
    if (redisCache.isConnected) {
      return await redisCache.flush();
    }
    return await memoryCache.flush();
  },

  async keys(pattern) {
    if (redisCache.isConnected) {
      return await redisCache.keys(pattern);
    }
    return await memoryCache.keys(pattern);
  }
};

/**
 * Price data caching
 */
export const priceCache = {
  /**
   * Get cached price data
   * @param {string} symbol - Asset symbol
   * @returns {Object|null} - Cached price data
   */
  async get(symbol) {
    const key = CACHE_CONFIG.KEYS.PRICE(symbol);
    return await cache.get(key);
  },

  /**
   * Set cached price data
   * @param {string} symbol - Asset symbol
   * @param {Object} priceData - Price data to cache
   * @returns {boolean} - Success status
   */
  async set(symbol, priceData) {
    const key = CACHE_CONFIG.KEYS.PRICE(symbol);
    return await cache.set(key, priceData, CACHE_CONFIG.PRICE_TTL);
  },

  /**
   * Get or fetch price data
   * @param {string} symbol - Asset symbol
   * @returns {Object} - Price data
   */
  async getOrFetch(symbol) {
    let priceData = await this.get(symbol);
    
    if (!priceData) {
      // Fetch from database
      const latestPrice = await prisma.price.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' }
      });

      if (latestPrice) {
        priceData = {
          price: latestPrice.price,
          change24h: latestPrice.change24h,
          volume24h: latestPrice.volume24h,
          timestamp: latestPrice.timestamp
        };
        
        // Cache the data
        await this.set(symbol, priceData);
      }
    }
    
    return priceData;
  },

  /**
   * Invalidate price cache
   * @param {string} symbol - Asset symbol
   * @returns {boolean} - Success status
   */
  async invalidate(symbol) {
    const key = CACHE_CONFIG.KEYS.PRICE(symbol);
    return await cache.del(key);
  }
};

/**
 * Order book caching
 */
export const orderBookCache = {
  /**
   * Get cached order book
   * @param {string} tradingPair - Trading pair
   * @returns {Object|null} - Cached order book
   */
  async get(tradingPair) {
    const key = CACHE_CONFIG.KEYS.ORDER_BOOK(tradingPair);
    return await cache.get(key);
  },

  /**
   * Set cached order book
   * @param {string} tradingPair - Trading pair
   * @param {Object} orderBook - Order book data
   * @returns {boolean} - Success status
   */
  async set(tradingPair, orderBook) {
    const key = CACHE_CONFIG.KEYS.ORDER_BOOK(tradingPair);
    return await cache.set(key, orderBook, CACHE_CONFIG.ORDER_BOOK_TTL);
  },

  /**
   * Get or fetch order book
   * @param {string} tradingPair - Trading pair
   * @param {number} limit - Number of orders to fetch
   * @returns {Object} - Order book data
   */
  async getOrFetch(tradingPair, limit = 20) {
    let orderBook = await this.get(tradingPair);
    
    if (!orderBook) {
      // Fetch from database
      const [buyOrders, sellOrders] = await Promise.all([
        prisma.order.findMany({
          where: {
            tradingPair,
            side: 'BUY',
            status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
          },
          orderBy: { price: 'desc' },
          take: limit
        }),
        prisma.order.findMany({
          where: {
            tradingPair,
            side: 'SELL',
            status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
          },
          orderBy: { price: 'asc' },
          take: limit
        })
      ]);

      orderBook = {
        buyOrders: buyOrders.map(order => ({
          id: order.id,
          price: order.price,
          amount: order.amount,
          remaining: order.remainingAmount || order.amount,
          timestamp: order.createdAt
        })),
        sellOrders: sellOrders.map(order => ({
          id: order.id,
          price: order.price,
          amount: order.amount,
          remaining: order.remainingAmount || order.amount,
          timestamp: order.createdAt
        }))
      };
      
      // Cache the data
      await this.set(tradingPair, orderBook);
    }
    
    return orderBook;
  },

  /**
   * Invalidate order book cache
   * @param {string} tradingPair - Trading pair
   * @returns {boolean} - Success status
   */
  async invalidate(tradingPair) {
    const key = CACHE_CONFIG.KEYS.ORDER_BOOK(tradingPair);
    return await cache.del(key);
  }
};

/**
 * Recent trades caching
 */
export const tradesCache = {
  /**
   * Get cached recent trades
   * @param {string} tradingPair - Trading pair
   * @returns {Array|null} - Cached trades
   */
  async get(tradingPair) {
    const key = CACHE_CONFIG.KEYS.RECENT_TRADES(tradingPair);
    return await cache.get(key);
  },

  /**
   * Set cached recent trades
   * @param {string} tradingPair - Trading pair
   * @param {Array} trades - Trades data
   * @returns {boolean} - Success status
   */
  async set(tradingPair, trades) {
    const key = CACHE_CONFIG.KEYS.RECENT_TRADES(tradingPair);
    return await cache.set(key, trades, CACHE_CONFIG.TRADES_TTL);
  },

  /**
   * Get or fetch recent trades
   * @param {string} tradingPair - Trading pair
   * @param {number} limit - Number of trades to fetch
   * @returns {Array} - Recent trades
   */
  async getOrFetch(tradingPair, limit = 20) {
    let trades = await this.get(tradingPair);
    
    if (!trades) {
      // Fetch from database
      const recentTrades = await prisma.trade.findMany({
        where: { tradingPair },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } }
        }
      });

      trades = recentTrades.map(trade => ({
        id: trade.id,
        price: trade.price,
        amount: trade.amount,
        side: trade.side,
        timestamp: trade.timestamp,
        buyer: trade.buyer,
        seller: trade.seller
      }));
      
      // Cache the data
      await this.set(tradingPair, trades);
    }
    
    return trades;
  },

  /**
   * Invalidate trades cache
   * @param {string} tradingPair - Trading pair
   * @returns {boolean} - Success status
   */
  async invalidate(tradingPair) {
    const key = CACHE_CONFIG.KEYS.RECENT_TRADES(tradingPair);
    return await cache.del(key);
  }
};

/**
 * User data caching
 */
export const userCache = {
  /**
   * Get cached user balance
   * @param {string} userId - User ID
   * @returns {Object|null} - Cached user balance
   */
  async getBalance(userId) {
    const key = CACHE_CONFIG.KEYS.USER_BALANCE(userId);
    return await cache.get(key);
  },

  /**
   * Set cached user balance
   * @param {string} userId - User ID
   * @param {Object} balance - User balance data
   * @returns {boolean} - Success status
   */
  async setBalance(userId, balance) {
    const key = CACHE_CONFIG.KEYS.USER_BALANCE(userId);
    return await cache.set(key, balance, CACHE_CONFIG.USER_DATA_TTL);
  },

  /**
   * Get cached user orders
   * @param {string} userId - User ID
   * @returns {Array|null} - Cached user orders
   */
  async getOrders(userId) {
    const key = CACHE_CONFIG.KEYS.USER_ORDERS(userId);
    return await cache.get(key);
  },

  /**
   * Set cached user orders
   * @param {string} userId - User ID
   * @param {Array} orders - User orders
   * @returns {boolean} - Success status
   */
  async setOrders(userId, orders) {
    const key = CACHE_CONFIG.KEYS.USER_ORDERS(userId);
    return await cache.set(key, orders, CACHE_CONFIG.USER_DATA_TTL);
  },

  /**
   * Invalidate user cache
   * @param {string} userId - User ID
   * @returns {boolean} - Success status
   */
  async invalidateUser(userId) {
    const balanceKey = CACHE_CONFIG.KEYS.USER_BALANCE(userId);
    const ordersKey = CACHE_CONFIG.KEYS.USER_ORDERS(userId);
    
    await Promise.all([
      cache.del(balanceKey),
      cache.del(ordersKey)
    ]);
    
    return true;
  }
};

/**
 * Chart data caching
 */
export const chartCache = {
  /**
   * Get cached chart data
   * @param {string} symbol - Asset symbol
   * @param {string} timeframe - Timeframe
   * @returns {Array|null} - Cached chart data
   */
  async get(symbol, timeframe) {
    const key = CACHE_CONFIG.KEYS.CHART_DATA(symbol, timeframe);
    return await cache.get(key);
  },

  /**
   * Set cached chart data
   * @param {string} symbol - Asset symbol
   * @param {string} timeframe - Timeframe
   * @param {Array} chartData - Chart data
   * @returns {boolean} - Success status
   */
  async set(symbol, timeframe, chartData) {
    const key = CACHE_CONFIG.KEYS.CHART_DATA(symbol, timeframe);
    return await cache.set(key, chartData, CACHE_CONFIG.CHART_DATA_TTL);
  },

  /**
   * Invalidate chart cache
   * @param {string} symbol - Asset symbol
   * @param {string} timeframe - Timeframe
   * @returns {boolean} - Success status
   */
  async invalidate(symbol, timeframe) {
    const key = CACHE_CONFIG.KEYS.CHART_DATA(symbol, timeframe);
    return await cache.del(key);
  }
};

/**
 * Cache management utilities
 */
export const cacheManager = {
  /**
   * Clear all caches
   * @returns {boolean} - Success status
   */
  async clearAll() {
    return await cache.flush();
  },

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  async getStats() {
    const keys = await cache.keys('*');
    const stats = {
      totalKeys: keys.length,
      priceKeys: keys.filter(k => k.startsWith('price:')).length,
      orderBookKeys: keys.filter(k => k.startsWith('orderbook:')).length,
      tradesKeys: keys.filter(k => k.startsWith('trades:')).length,
      userKeys: keys.filter(k => k.startsWith('user:')).length,
      chartKeys: keys.filter(k => k.startsWith('chart:')).length
    };
    
    return stats;
  },

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Cache key pattern
   * @returns {number} - Number of keys deleted
   */
  async invalidatePattern(pattern) {
    const keys = await cache.keys(pattern);
    let deleted = 0;
    
    for (const key of keys) {
      if (await cache.del(key)) {
        deleted++;
      }
    }
    
    return deleted;
  }
};

export default cache;


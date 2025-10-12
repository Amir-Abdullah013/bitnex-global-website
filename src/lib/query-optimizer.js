/**
 * Query Optimizer for Bitnex Global
 * Optimized Prisma queries for high-performance order and trade fetching
 */

import { PrismaClient } from '@prisma/client';
import { orderBookCache, tradesCache, userCache } from './cache-service';

const prisma = new PrismaClient();

/**
 * Optimized order queries
 */
export const orderQueries = {
  /**
   * Get user orders with pagination and filtering
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} - Orders and pagination info
   */
  async getUserOrders(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status = null,
      side = null,
      tradingPair = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = { userId };
    if (status) where.status = status;
    if (side) where.side = side;
    if (tradingPair) where.tradingPair = tradingPair;

    // Check cache first
    const cacheKey = `user:${userId}:orders:${JSON.stringify(options)}`;
    const cached = await userCache.getOrders(userId);
    
    if (cached && !status && !side && !tradingPair) {
      return {
        orders: cached.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total: cached.length,
          totalPages: Math.ceil(cached.length / limit)
        }
      };
    }

    // Execute optimized query
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          type: true,
          side: true,
          amount: true,
          price: true,
          remainingAmount: true,
          status: true,
          tradingPair: true,
          createdAt: true,
          updatedAt: true,
          filledAt: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get order book with optimized query
   * @param {string} tradingPair - Trading pair
   * @param {number} limit - Number of orders per side
   * @returns {Object} - Order book data
   */
  async getOrderBook(tradingPair, limit = 20) {
    // Try cache first
    const cached = await orderBookCache.get(tradingPair);
    if (cached) {
      return cached;
    }

    // Optimized parallel queries
    const [buyOrders, sellOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          tradingPair,
          side: 'BUY',
          status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
        },
        select: {
          id: true,
          price: true,
          amount: true,
          remainingAmount: true,
          createdAt: true
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
        select: {
          id: true,
          price: true,
          amount: true,
          remainingAmount: true,
          createdAt: true
        },
        orderBy: { price: 'asc' },
        take: limit
      })
    ]);

    const orderBook = {
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

    // Cache the result
    await orderBookCache.set(tradingPair, orderBook);

    return orderBook;
  },

  /**
   * Get recent trades with optimized query
   * @param {string} tradingPair - Trading pair
   * @param {number} limit - Number of trades
   * @returns {Array} - Recent trades
   */
  async getRecentTrades(tradingPair, limit = 20) {
    // Try cache first
    const cached = await tradesCache.get(tradingPair);
    if (cached) {
      return cached.slice(0, limit);
    }

    // Optimized query with minimal data selection
    const trades = await prisma.trade.findMany({
      where: { tradingPair },
      select: {
        id: true,
        price: true,
        amount: true,
        side: true,
        timestamp: true,
        buyer: {
          select: { id: true, name: true }
        },
        seller: {
          select: { id: true, name: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    const formattedTrades = trades.map(trade => ({
      id: trade.id,
      price: trade.price,
      amount: trade.amount,
      side: trade.side,
      timestamp: trade.timestamp,
      buyer: trade.buyer,
      seller: trade.seller
    }));

    // Cache the result
    await tradesCache.set(tradingPair, formattedTrades);

    return formattedTrades;
  },

  /**
   * Get user's trading statistics
   * @param {string} userId - User ID
   * @param {Object} options - Time range options
   * @returns {Object} - Trading statistics
   */
  async getUserTradingStats(userId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date()
    } = options;

    // Use aggregation for better performance
    const [tradeStats, orderStats] = await Promise.all([
      prisma.trade.aggregate({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ],
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { id: true },
        _sum: { amount: true, value: true }
      }),
      prisma.order.aggregate({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { id: true },
        _sum: { amount: true }
      })
    ]);

    return {
      totalTrades: tradeStats._count.id,
      totalVolume: tradeStats._sum.amount || 0,
      totalValue: tradeStats._sum.value || 0,
      totalOrders: orderStats._count.id,
      totalOrderAmount: orderStats._sum.amount || 0
    };
  }
};

/**
 * Optimized trade queries
 */
export const tradeQueries = {
  /**
   * Get trades with advanced filtering
   * @param {Object} filters - Filter options
   * @param {Object} options - Query options
   * @returns {Object} - Trades and pagination
   */
  async getTrades(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (filters.tradingPair) where.tradingPair = filters.tradingPair;
    if (filters.userId) {
      where.OR = [
        { buyerId: filters.userId },
        { sellerId: filters.userId }
      ];
    }
    if (filters.startDate) where.timestamp = { gte: filters.startDate };
    if (filters.endDate) {
      where.timestamp = {
        ...where.timestamp,
        lte: filters.endDate
      };
    }

    // Execute optimized query
    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        select: {
          id: true,
          tradingPair: true,
          price: true,
          amount: true,
          side: true,
          timestamp: true,
          buyer: {
            select: { id: true, name: true }
          },
          seller: {
            select: { id: true, name: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.trade.count({ where })
    ]);

    return {
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get market statistics
   * @param {string} tradingPair - Trading pair
   * @param {Object} options - Time range options
   * @returns {Object} - Market statistics
   */
  async getMarketStats(tradingPair, options = {}) {
    const {
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endDate = new Date()
    } = options;

    // Use aggregation for better performance
    const [stats, priceData] = await Promise.all([
      prisma.trade.aggregate({
        where: {
          tradingPair,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { id: true },
        _sum: { amount: true, value: true },
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true }
      }),
      prisma.price.findFirst({
        where: { symbol: tradingPair.split('/')[0] },
        orderBy: { timestamp: 'desc' },
        select: { price: true, change24h: true }
      })
    ]);

    return {
      totalTrades: stats._count.id,
      totalVolume: stats._sum.amount || 0,
      totalValue: stats._sum.value || 0,
      averagePrice: stats._avg.price || 0,
      highPrice: stats._max.price || 0,
      lowPrice: stats._min.price || 0,
      currentPrice: priceData?.price || 0,
      priceChange24h: priceData?.change24h || 0
    };
  }
};

/**
 * Optimized portfolio queries
 */
export const portfolioQueries = {
  /**
   * Get user portfolio with optimized queries
   * @param {string} userId - User ID
   * @returns {Object} - Portfolio data
   */
  async getUserPortfolio(userId) {
    // Check cache first
    const cached = await userCache.getBalance(userId);
    if (cached) {
      return cached;
    }

    // Get user data with optimized query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        usdBalance: true,
        bnxBalance: true,
        tikiBalance: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get recent trades for P&L calculation
    const recentTrades = await prisma.trade.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      select: {
        id: true,
        price: true,
        amount: true,
        side: true,
        timestamp: true
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Calculate P&L (simplified)
    let totalPnL = 0;
    const tradeHistory = recentTrades.map(trade => {
      const pnl = trade.side === 'BUY' ? -trade.price * trade.amount : trade.price * trade.amount;
      totalPnL += pnl;
      return {
        id: trade.id,
        price: trade.price,
        amount: trade.amount,
        side: trade.side,
        timestamp: trade.timestamp,
        pnl
      };
    });

    const portfolio = {
      userId: user.id,
      balances: {
        usd: user.usdBalance || 0,
        bnx: user.bnxBalance || 0,
        tiki: user.tikiBalance || 0
      },
      totalValue: (user.usdBalance || 0) + ((user.bnxBalance || 0) * (await this.getCurrentPrice('BNX'))) + ((user.tikiBalance || 0) * (await this.getCurrentPrice('TIKI'))),
      totalPnL,
      tradeHistory: tradeHistory.slice(0, 20), // Last 20 trades
      createdAt: user.createdAt
    };

    // Cache the result
    await userCache.setBalance(userId, portfolio);

    return portfolio;
  },

  /**
   * Get current price for asset
   * @param {string} symbol - Asset symbol
   * @returns {number} - Current price
   */
  async getCurrentPrice(symbol) {
    const price = await prisma.price.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' },
      select: { price: true }
    });

    return price?.price || 0;
  }
};

/**
 * Optimized admin queries
 */
export const adminQueries = {
  /**
   * Get system statistics
   * @returns {Object} - System statistics
   */
  async getSystemStats() {
    const [
      userCount,
      orderCount,
      tradeCount,
      totalVolume,
      activeUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.trade.count(),
      prisma.trade.aggregate({
        _sum: { value: true }
      }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    return {
      users: {
        total: userCount,
        active: activeUsers
      },
      trading: {
        totalOrders: orderCount,
        totalTrades: tradeCount,
        totalVolume: totalVolume._sum.value || 0
      }
    };
  },

  /**
   * Get user activity report
   * @param {Object} options - Report options
   * @returns {Array} - User activity data
   */
  async getUserActivityReport(options = {}) {
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate = new Date(),
      limit = 100
    } = options;

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            orders: true,
            trades: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      totalOrders: user._count.orders,
      totalTrades: user._count.trades
    }));
  }
};

/**
 * Query performance monitoring
 */
export const queryMonitor = {
  /**
   * Monitor query performance
   * @param {string} queryName - Name of the query
   * @param {Function} queryFn - Query function to execute
   * @returns {Object} - Query result with performance metrics
   */
  async monitor(queryName, queryFn) {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      // Log slow queries
      if (executionTime > 1000) { // More than 1 second
        console.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }
      
      return {
        result,
        performance: {
          queryName,
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Query failed: ${queryName} after ${executionTime}ms`, error);
      throw error;
    }
  }
};

export default {
  orderQueries,
  tradeQueries,
  portfolioQueries,
  adminQueries,
  queryMonitor
};


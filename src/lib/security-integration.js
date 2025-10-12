/**
 * Security Integration for Bitnex Global
 * Comprehensive security implementation with all components integrated
 */

import { rateLimiter, rateLimits, checkUserRateLimit } from './rate-limiter';
import { validateOrder, validateOrderUpdate, validateOrderCancellation } from './order-validation';
import { priceCache, orderBookCache, tradesCache, userCache } from './cache-service';
import { queryOptimizer } from './query-optimizer';
import auditLogger, { AUDIT_EVENTS, AUDIT_LEVELS } from './audit-logger';
import { securityMiddleware } from './security-middleware';
import { performanceMonitor, databaseMonitor, apiMonitor } from './performance-monitor';

/**
 * Comprehensive security middleware stack
 */
export const securityStack = {
  /**
   * Apply all security middleware to an Express app
   * @param {Object} app - Express app instance
   */
  applySecurityStack(app) {
    // Security headers
    app.use(securityMiddleware.securityHeaders());
    
    // CORS protection
    app.use(securityMiddleware.cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    
    // Request size limits
    app.use(securityMiddleware.requestSizeLimit(1024 * 1024)); // 1MB
    
    // SQL injection protection
    app.use(securityMiddleware.sqlInjectionProtection());
    
    // XSS protection
    app.use(securityMiddleware.xssProtection());
    
    // Rate limiting
    app.use('/api/auth', rateLimits.auth);
    app.use('/api/trading', rateLimits.trading);
    app.use('/api/orders', rateLimits.orders);
    app.use('/api/admin', rateLimits.admin);
    app.use('/api', rateLimits.general);
    
    // Performance monitoring
    app.use((req, res, next) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      req.requestId = requestId;
      
      performanceMonitor.startRequest(requestId, {
        type: 'HTTP_REQUEST',
        method: req.method,
        url: req.url,
        ip: req.ip
      });
      
      res.on('finish', () => {
        performanceMonitor.endRequest(requestId, {
          statusCode: res.statusCode,
          success: res.statusCode < 400
        });
      });
      
      next();
    });
  },

  /**
   * Apply security to specific routes
   * @param {Object} router - Express router
   * @param {Object} options - Security options
   */
  applyRouteSecurity(router, options = {}) {
    const {
      requireAuth = true,
      requireAdmin = false,
      rateLimit = 'general',
      validateInput = null
    } = options;

    // Authentication
    if (requireAuth) {
      router.use(securityMiddleware.requireAuth());
    }

    // Admin authorization
    if (requireAdmin) {
      router.use(securityMiddleware.requireAdmin());
    }

    // Rate limiting
    if (rateLimit) {
      router.use(securityMiddleware.rateLimit({ type: rateLimit }));
    }

    // Input validation
    if (validateInput) {
      router.use(securityMiddleware.validateInput(validateInput));
    }
  }
};

/**
 * Enhanced API route with security
 */
export const secureRoute = {
  /**
   * Create a secure API route
   * @param {Object} options - Route options
   * @returns {Function} - Route handler
   */
  create(options = {}) {
    const {
      method = 'GET',
      path = '/',
      handler,
      security = {},
      cache = null,
      validation = null
    } = options;

    return async (req, res, next) => {
      try {
        // Apply security checks
        if (security.rateLimit) {
          const rateLimitResult = await checkUserRateLimit(
            req.user?.id || req.ip,
            security.rateLimit
          );
          
          if (!rateLimitResult.allowed) {
            return res.status(429).json({
              success: false,
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            });
          }
        }

        // Check cache
        if (cache && cache.key) {
          const cached = await cache.get(cache.key);
          if (cached) {
            return res.json({
              success: true,
              data: cached,
              cached: true
            });
          }
        }

        // Execute handler
        const result = await handler(req, res, next);

        // Cache result
        if (cache && cache.key && result) {
          await cache.set(cache.key, result, cache.ttl);
        }

        // Log successful request
        await auditLogger.log({
          userId: req.user?.id,
          event: 'API_REQUEST_SUCCESS',
          level: AUDIT_LEVELS.INFO,
          description: `API request successful: ${method} ${path}`,
          metadata: {
            method,
            path,
            statusCode: res.statusCode
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return result;
      } catch (error) {
        // Log error
        await auditLogger.log({
          userId: req.user?.id,
          event: 'API_REQUEST_ERROR',
          level: AUDIT_LEVELS.HIGH,
          description: `API request failed: ${method} ${path}`,
          metadata: {
            method,
            path,
            error: error.message
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        next(error);
      }
    };
  }
};

/**
 * Enhanced order processing with security
 */
export const secureOrderProcessing = {
  /**
   * Process order with full security validation
   * @param {Object} orderData - Order data
   * @param {Object} req - Request object
   * @returns {Object} - Processing result
   */
  async processOrder(orderData, req) {
    const startTime = Date.now();
    
    try {
      // Validate order
      const validation = await validateOrder(orderData);
      if (!validation.isValid) {
        await auditLogger.log({
          userId: req.user?.id,
          event: AUDIT_EVENTS.ORDER_PLACED,
          level: AUDIT_LEVELS.HIGH,
          description: 'Order validation failed',
          metadata: {
            errors: validation.errors,
            orderData: validation.sanitizedData
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return {
          success: false,
          error: 'Order validation failed',
          details: validation.errors
        };
      }

      // Check rate limits
      const rateLimitResult = await checkUserRateLimit(req.user.id, 'trading');
      if (!rateLimitResult.allowed) {
        await auditLogger.logSecurity({
          userId: req.user.id,
          event: AUDIT_EVENTS.RATE_LIMIT_EXCEEDED,
          severity: 'MEDIUM',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: {
            action: 'ORDER_PLACEMENT',
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining
          }
        });

        return {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        };
      }

      // Process order (simplified)
      const order = await this.createOrder(validation.sanitizedData);
      
      // Log successful order
      await auditLogger.logTrading({
        userId: req.user.id,
        event: AUDIT_EVENTS.ORDER_PLACED,
        orderId: order.id,
        tradingPair: order.tradingPair,
        amount: order.amount,
        price: order.price,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Invalidate relevant caches
      await this.invalidateCaches(order.tradingPair, req.user.id);

      const duration = Date.now() - startTime;
      console.log(`Order processed in ${duration}ms`);

      return {
        success: true,
        order,
        processingTime: duration
      };

    } catch (error) {
      // Log error
      await auditLogger.log({
        userId: req.user?.id,
        event: 'ORDER_PROCESSING_ERROR',
        level: AUDIT_LEVELS.CRITICAL,
        description: 'Order processing failed',
        metadata: {
          error: error.message,
          orderData
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw error;
    }
  },

  /**
   * Create order in database
   * @param {Object} orderData - Validated order data
   * @returns {Object} - Created order
   */
  async createOrder(orderData) {
    // This would integrate with your order creation logic
    return {
      id: `order_${Date.now()}`,
      ...orderData,
      status: 'PENDING',
      createdAt: new Date()
    };
  },

  /**
   * Invalidate relevant caches
   * @param {string} tradingPair - Trading pair
   * @param {string} userId - User ID
   */
  async invalidateCaches(tradingPair, userId) {
    await Promise.all([
      orderBookCache.invalidate(tradingPair),
      tradesCache.invalidate(tradingPair),
      userCache.invalidateUser(userId)
    ]);
  }
};

/**
 * Enhanced data fetching with caching and security
 */
export const secureDataFetching = {
  /**
   * Fetch order book with caching and security
   * @param {string} tradingPair - Trading pair
   * @param {Object} req - Request object
   * @returns {Object} - Order book data
   */
  async fetchOrderBook(tradingPair, req) {
    try {
      // Check cache first
      const cached = await orderBookCache.get(tradingPair);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true
        };
      }

      // Fetch from database with optimized query
      const orderBook = await queryOptimizer.orderQueries.getOrderBook(tradingPair);
      
      // Cache the result
      await orderBookCache.set(tradingPair, orderBook);

      return {
        success: true,
        data: orderBook,
        cached: false
      };

    } catch (error) {
      await auditLogger.log({
        event: 'ORDER_BOOK_FETCH_ERROR',
        level: AUDIT_LEVELS.MEDIUM,
        description: 'Failed to fetch order book',
        metadata: {
          tradingPair,
          error: error.message
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw error;
    }
  },

  /**
   * Fetch user portfolio with caching and security
   * @param {string} userId - User ID
   * @param {Object} req - Request object
   * @returns {Object} - Portfolio data
   */
  async fetchUserPortfolio(userId, req) {
    try {
      // Check cache first
      const cached = await userCache.getBalance(userId);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true
        };
      }

      // Fetch from database with optimized query
      const portfolio = await queryOptimizer.portfolioQueries.getUserPortfolio(userId);
      
      // Cache the result
      await userCache.setBalance(userId, portfolio);

      return {
        success: true,
        data: portfolio,
        cached: false
      };

    } catch (error) {
      await auditLogger.log({
        userId,
        event: 'PORTFOLIO_FETCH_ERROR',
        level: AUDIT_LEVELS.MEDIUM,
        description: 'Failed to fetch user portfolio',
        metadata: {
          error: error.message
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      throw error;
    }
  }
};

/**
 * Security monitoring and alerting
 */
export const securityMonitoring = {
  /**
   * Monitor security events
   * @returns {Object} - Security monitoring data
   */
  async getSecurityStatus() {
    const [
      rateLimitStats,
      performanceStats,
      errorSummary,
      recentAlerts
    ] = await Promise.all([
      rateLimiter.getActiveLimits(),
      performanceMonitor.getStats(),
      performanceMonitor.getErrorSummary(),
      auditLogger.getAuditLogs({
        level: AUDIT_LEVELS.HIGH,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      })
    ]);

    return {
      rateLimits: rateLimitStats,
      performance: performanceStats,
      errors: errorSummary,
      alerts: recentAlerts.logs,
      recommendations: this.getSecurityRecommendations(performanceStats, errorSummary)
    };
  },

  /**
   * Get security recommendations
   * @param {Object} performanceStats - Performance statistics
   * @param {Object} errorSummary - Error summary
   * @returns {Array} - Security recommendations
   */
  getSecurityRecommendations(performanceStats, errorSummary) {
    const recommendations = [];

    // Check response time
    if (performanceStats.averageResponseTime > 1000) {
      recommendations.push({
        type: 'PERFORMANCE',
        severity: 'WARNING',
        message: 'Consider optimizing slow queries or adding more caching',
        action: 'Review database queries and implement query optimization'
      });
    }

    // Check error rate
    if (performanceStats.errorRate > 0.05) {
      recommendations.push({
        type: 'RELIABILITY',
        severity: 'HIGH',
        message: 'High error rate detected, investigate and fix issues',
        action: 'Review error logs and implement better error handling'
      });
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUtilization = memoryUsage.heapUsed / memoryUsage.heapTotal;
    if (heapUtilization > 0.8) {
      recommendations.push({
        type: 'RESOURCE',
        severity: 'WARNING',
        message: 'High memory usage detected',
        action: 'Consider implementing memory optimization or scaling'
      });
    }

    return recommendations;
  }
};

export default {
  securityStack,
  secureRoute,
  secureOrderProcessing,
  secureDataFetching,
  securityMonitoring
};



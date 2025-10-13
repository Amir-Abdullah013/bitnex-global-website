/**
 * Rate Limiter for Bitnex Global
 * Prevents abuse and ensures fair usage of API endpoints
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  /**
   * Check if request is within rate limit
   * @param {string} identifier - IP address or user ID
   * @param {Object} options - Rate limit options
   * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
   */
  checkLimit(identifier, options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100, // 100 requests per window
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request history for this identifier
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const requestHistory = this.requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    
    // Check if limit is exceeded
    const isAllowed = validRequests.length < maxRequests;
    
    if (isAllowed) {
      // Add current request
      validRequests.push(now);
      this.requests.set(identifier, validRequests);
    }

    const remaining = Math.max(0, maxRequests - validRequests.length);
    const resetTime = now + windowMs;

    return {
      allowed: isAllowed,
      remaining,
      resetTime,
      totalRequests: validRequests.length,
      limit: maxRequests
    };
  }

  /**
   * Get rate limit info without consuming a request
   * @param {string} identifier - IP address or user ID
   * @param {Object} options - Rate limit options
   * @returns {Object} - Rate limit status
   */
  getStatus(identifier, options = {}) {
    const {
      windowMs = 15 * 60 * 1000,
      maxRequests = 100
    } = options;

    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(identifier)) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + windowMs,
        totalRequests: 0,
        limit: maxRequests
      };
    }

    const requestHistory = this.requests.get(identifier);
    const validRequests = requestHistory.filter(timestamp => timestamp > windowStart);
    const remaining = Math.max(0, maxRequests - validRequests.length);

    return {
      allowed: remaining > 0,
      remaining,
      resetTime: now + windowMs,
      totalRequests: validRequests.length,
      limit: maxRequests
    };
  }

  /**
   * Clean up old request data
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }

  /**
   * Reset rate limit for specific identifier
   * @param {string} identifier - IP address or user ID
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }

  /**
   * Get all active rate limits (for monitoring)
   * @returns {Array} - Array of active rate limits
   */
  getActiveLimits() {
    const activeLimits = [];
    
    for (const [identifier, requests] of this.requests.entries()) {
      activeLimits.push({
        identifier,
        requestCount: requests.length,
        lastRequest: Math.max(...requests),
        oldestRequest: Math.min(...requests)
      });
    }

    return activeLimits;
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Express.js middleware for rate limiting
 * @param {Object} options - Rate limit options
 * @returns {Function} - Express middleware
 */
export const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    maxRequests = 100,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    onLimitReached = null
  } = options;

  return (req, res, next) => {
    const identifier = keyGenerator(req);
    const result = rateLimiter.checkLimit(identifier, {
      windowMs,
      maxRequests,
      skipSuccessfulRequests,
      skipFailedRequests
    });

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });

    if (!result.allowed) {
      if (onLimitReached) {
        onLimitReached(req, res);
      }
      
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }

    next();
  };
};

/**
 * API-specific rate limits
 */
export const rateLimits = {
  // General API rate limit
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please slow down.'
  }),

  // Authentication rate limit
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  }),

  // Trading rate limit
  trading: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many trading requests, please slow down.'
  }),

  // Order placement rate limit
  orders: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many order requests, please slow down.'
  }),

  // Price data rate limit
  prices: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many price requests, please slow down.'
  }),

  // Withdrawal rate limit
  withdrawals: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many withdrawal requests, please try again later.'
  }),

  // Admin operations rate limit
  admin: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many admin requests, please slow down.'
  })
};

/**
 * User-specific rate limiting
 * @param {string} userId - User ID
 * @param {string} action - Action type
 * @returns {Object} - Rate limit result
 */
export const checkUserRateLimit = (userId, action = 'general') => {
  const limits = {
    trade: { windowMs: 60 * 1000, maxRequests: 10 },
    deposit: { windowMs: 60 * 1000, maxRequests: 5 },
    withdraw: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
    general: { windowMs: 15 * 60 * 1000, maxRequests: 100 }
  };

  const limit = limits[action] || limits.general;
  return rateLimiter.checkLimit(`user:${userId}:${action}`, limit);
};

/**
 * IP-specific rate limiting
 * @param {string} ip - IP address
 * @param {string} action - Action type
 * @returns {Object} - Rate limit result
 */
export const checkIPRateLimit = (ip, action = 'general') => {
  const limits = {
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
    api: { windowMs: 15 * 60 * 1000, maxRequests: 200 },
    trading: { windowMs: 60 * 1000, maxRequests: 20 },
    general: { windowMs: 15 * 60 * 1000, maxRequests: 100 }
  };

  const limit = limits[action] || limits.general;
  return rateLimiter.checkLimit(`ip:${ip}:${action}`, limit);
};

export default rateLimiter;




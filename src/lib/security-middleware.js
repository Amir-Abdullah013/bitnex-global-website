/**
 * Security Middleware for Bitnex Global
 * Comprehensive security measures for API protection
 */

import { rateLimiter, checkUserRateLimit, checkIPRateLimit } from './rate-limiter';
import { validateOrder } from './order-validation';
import auditLogger from './audit-logger';
import { AUDIT_EVENTS, AUDIT_LEVELS } from './audit-logger';

/**
 * Security middleware factory
 */
export const securityMiddleware = {
  /**
   * Rate limiting middleware
   * @param {Object} options - Rate limit options
   * @returns {Function} - Express middleware
   */
  rateLimit: (options = {}) => {
    const {
      type = 'general',
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    return async (req, res, next) => {
      try {
        const identifier = req.user?.id || req.ip;
        const result = await checkUserRateLimit(identifier, type);

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });

        if (!result.allowed) {
          // Log rate limit exceeded
          await auditLogger.logSecurity({
            userId: req.user?.id,
            event: AUDIT_EVENTS.RATE_LIMIT_EXCEEDED,
            severity: 'MEDIUM',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: {
              type,
              limit: result.limit,
              remaining: result.remaining
            }
          });

          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }

        next();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        next();
      }
    };
  },

  /**
   * Input validation middleware
   * @param {Object} schema - Validation schema
   * @returns {Function} - Express middleware
   */
  validateInput: (schema) => {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          });
        }

        req.body = value;
        next();
      } catch (error) {
        console.error('Input validation error:', error);
        res.status(500).json({
          success: false,
          error: 'Validation error'
        });
      }
    };
  },

  /**
   * Order validation middleware
   * @returns {Function} - Express middleware
   */
  validateOrder: () => {
    return async (req, res, next) => {
      try {
        const validation = await validateOrder(req.body);
        
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'Order validation failed',
            details: validation.errors.map(error => ({
              field: error.field,
              message: error.message,
              code: error.code
            }))
          });
        }

        req.validatedOrder = validation.sanitizedData;
        next();
      } catch (error) {
        console.error('Order validation error:', error);
        res.status(500).json({
          success: false,
          error: 'Order validation error'
        });
      }
    };
  },

  /**
   * Authentication middleware
   * @returns {Function} - Express middleware
   */
  requireAuth: () => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      next();
    };
  },

  /**
   * Admin authorization middleware
   * @returns {Function} - Express middleware
   */
  requireAdmin: () => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (req.user.role !== 'ADMIN') {
        // Log unauthorized access attempt
        auditLogger.logSecurity({
          userId: req.user.id,
          event: AUDIT_EVENTS.UNAUTHORIZED_ACCESS,
          severity: 'HIGH',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: {
            attemptedAction: 'ADMIN_ACCESS',
            userRole: req.user.role
          }
        });

        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      next();
    };
  },

  /**
   * IP whitelist middleware
   * @param {Array} allowedIPs - Array of allowed IP addresses
   * @returns {Function} - Express middleware
   */
  ipWhitelist: (allowedIPs = []) => {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        // Log blocked IP attempt
        auditLogger.logSecurity({
          event: AUDIT_EVENTS.UNAUTHORIZED_ACCESS,
          severity: 'HIGH',
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
          metadata: {
            attemptedAction: 'IP_WHITELIST_VIOLATION',
            allowedIPs
          }
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied from this IP address'
        });
      }

      next();
    };
  },

  /**
   * CORS security middleware
   * @param {Object} options - CORS options
   * @returns {Function} - Express middleware
   */
  cors: (options = {}) => {
    const {
      origin = process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials = true,
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With']
    } = options;

    return (req, res, next) => {
      const requestOrigin = req.get('Origin');
      
      // Check if origin is allowed
      if (origin !== '*' && requestOrigin && !origin.includes(requestOrigin)) {
        return res.status(403).json({
          success: false,
          error: 'CORS policy violation'
        });
      }

      res.set({
        'Access-Control-Allow-Origin': requestOrigin || origin,
        'Access-Control-Allow-Credentials': credentials.toString(),
        'Access-Control-Allow-Methods': methods.join(', '),
        'Access-Control-Allow-Headers': allowedHeaders.join(', ')
      });

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  },

  /**
   * Request size limit middleware
   * @param {number} limit - Size limit in bytes
   * @returns {Function} - Express middleware
   */
  requestSizeLimit: (limit = 1024 * 1024) => { // 1MB default
    return (req, res, next) => {
      const contentLength = parseInt(req.get('Content-Length') || '0');
      
      if (contentLength > limit) {
        return res.status(413).json({
          success: false,
          error: 'Request entity too large'
        });
      }

      next();
    };
  },

  /**
   * Security headers middleware
   * @returns {Function} - Express middleware
   */
  securityHeaders: () => {
    return (req, res, next) => {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
      });

      next();
    };
  },

  /**
   * SQL injection protection middleware
   * @returns {Function} - Express middleware
   */
  sqlInjectionProtection: () => {
    return (req, res, next) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
        /(\b(OR|AND)\s+1\s*=\s*1)/i,
        /(\b(OR|AND)\s+true)/i,
        /(\b(OR|AND)\s+false)/i
      ];

      const checkForSQLInjection = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            for (const pattern of sqlPatterns) {
              if (pattern.test(obj[key])) {
                return true;
              }
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (checkForSQLInjection(obj[key])) {
              return true;
            }
          }
        }
        return false;
      };

      if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query)) {
        // Log potential SQL injection attempt
        auditLogger.logSecurity({
          userId: req.user?.id,
          event: AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
          severity: 'HIGH',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: {
            type: 'SQL_INJECTION_ATTEMPT',
            body: req.body,
            query: req.query
          }
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid request data'
        });
      }

      next();
    };
  },

  /**
   * XSS protection middleware
   * @returns {Function} - Express middleware
   */
  xssProtection: () => {
    return (req, res, next) => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi
      ];

      const checkForXSS = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            for (const pattern of xssPatterns) {
              if (pattern.test(obj[key])) {
                return true;
              }
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (checkForXSS(obj[key])) {
              return true;
            }
          }
        }
        return false;
      };

      if (checkForXSS(req.body) || checkForXSS(req.query)) {
        // Log potential XSS attempt
        auditLogger.logSecurity({
          userId: req.user?.id,
          event: AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
          severity: 'HIGH',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          metadata: {
            type: 'XSS_ATTEMPT',
            body: req.body,
            query: req.query
          }
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid request data'
        });
      }

      next();
    };
  }
};

/**
 * Security configuration
 */
export const securityConfig = {
  // Rate limiting configurations
  rateLimits: {
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    api: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
    trading: { windowMs: 60 * 1000, maxRequests: 10 },
    admin: { windowMs: 60 * 1000, maxRequests: 30 }
  },

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  },

  // Request size limits
  limits: {
    json: 1024 * 1024, // 1MB
    urlencoded: 1024 * 1024, // 1MB
    text: 1024 * 1024 // 1MB
  }
};

export default securityMiddleware;



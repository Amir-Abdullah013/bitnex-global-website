/**
 * Audit Logger for Bitnex Global
 * Comprehensive logging system for all critical user actions and system events
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Audit log levels
 */
const AUDIT_LEVELS = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO'
};

/**
 * Audit event types
 */
const AUDIT_EVENTS = {
  // Authentication events
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // Trading events
  ORDER_PLACED: 'ORDER_PLACED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_FILLED: 'ORDER_FILLED',
  TRADE_EXECUTED: 'TRADE_EXECUTED',
  
  // Financial events
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  BALANCE_UPDATE: 'BALANCE_UPDATE',
  
  // Security events
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  
  // System events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  API_ERROR: 'API_ERROR',
  
  // Admin events
  ADMIN_ACTION: 'ADMIN_ACTION',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  
  // Data events
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  DATA_DELETION: 'DATA_DELETION'
};

/**
 * Audit logger class
 */
class AuditLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'audit');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get log file path for today
   * @returns {string} - Log file path
   */
  getLogFilePath() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `audit-${today}.log`);
  }

  /**
   * Format log entry
   * @param {Object} entry - Log entry data
   * @returns {string} - Formatted log entry
   */
  formatLogEntry(entry) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      ...entry
    });
  }

  /**
   * Write log entry to file
   * @param {Object} entry - Log entry data
   */
  writeToFile(entry) {
    try {
      const logEntry = this.formatLogEntry(entry);
      const logFile = this.getLogFilePath();
      
      fs.appendFileSync(logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write audit log to file:', error);
    }
  }

  /**
   * Write log entry to database
   * @param {Object} entry - Log entry data
   */
  async writeToDatabase(entry) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          event: entry.event,
          level: entry.level,
          description: entry.description,
          metadata: entry.metadata || {},
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          timestamp: new Date(entry.timestamp || Date.now())
        }
      });
    } catch (error) {
      console.error('Failed to write audit log to database:', error);
    }
  }

  /**
   * Log audit event
   * @param {Object} options - Log options
   */
  async log(options) {
    const {
      userId = null,
      event,
      level = AUDIT_LEVELS.INFO,
      description,
      metadata = {},
      ipAddress = null,
      userAgent = null,
      writeToFile = true,
      writeToDatabase = true
    } = options;

    const entry = {
      userId,
      event,
      level,
      description,
      metadata,
      ipAddress,
      userAgent
    };

    // Write to file
    if (writeToFile) {
      this.writeToFile(entry);
    }

    // Write to database
    if (writeToDatabase) {
      await this.writeToDatabase(entry);
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', entry);
    }
  }

  /**
   * Log authentication events
   * @param {Object} options - Log options
   */
  async logAuth(options) {
    const {
      userId,
      event,
      success,
      ipAddress,
      userAgent,
      metadata = {}
    } = options;

    const level = success ? AUDIT_LEVELS.INFO : AUDIT_LEVELS.HIGH;
    const description = success 
      ? `User ${userId} ${event.toLowerCase()} successfully`
      : `Failed ${event.toLowerCase()} attempt for user ${userId}`;

    await this.log({
      userId,
      event,
      level,
      description,
      metadata: {
        success,
        ...metadata
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log trading events
   * @param {Object} options - Log options
   */
  async logTrading(options) {
    const {
      userId,
      event,
      orderId = null,
      tradeId = null,
      tradingPair,
      amount,
      price,
      ipAddress,
      userAgent,
      metadata = {}
    } = options;

    const level = AUDIT_LEVELS.MEDIUM;
    const description = `Trading event: ${event} for user ${userId}`;

    await this.log({
      userId,
      event,
      level,
      description,
      metadata: {
        orderId,
        tradeId,
        tradingPair,
        amount,
        price,
        ...metadata
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log financial events
   * @param {Object} options - Log options
   */
  async logFinancial(options) {
    const {
      userId,
      event,
      amount,
      currency,
      transactionId = null,
      ipAddress,
      userAgent,
      metadata = {}
    } = options;

    const level = AUDIT_LEVELS.HIGH;
    const description = `Financial event: ${event} for user ${userId}`;

    await this.log({
      userId,
      event,
      level,
      description,
      metadata: {
        amount,
        currency,
        transactionId,
        ...metadata
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log security events
   * @param {Object} options - Log options
   */
  async logSecurity(options) {
    const {
      userId,
      event,
      severity,
      ipAddress,
      userAgent,
      metadata = {}
    } = options;

    const level = severity === 'HIGH' ? AUDIT_LEVELS.CRITICAL : AUDIT_LEVELS.HIGH;
    const description = `Security event: ${event} for user ${userId}`;

    await this.log({
      userId,
      event,
      level,
      description,
      metadata: {
        severity,
        ...metadata
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log system events
   * @param {Object} options - Log options
   */
  async logSystem(options) {
    const {
      event,
      level = AUDIT_LEVELS.MEDIUM,
      description,
      metadata = {}
    } = options;

    await this.log({
      event,
      level,
      description,
      metadata
    });
  }

  /**
   * Log admin actions
   * @param {Object} options - Log options
   */
  async logAdmin(options) {
    const {
      adminId,
      event,
      targetUserId = null,
      action,
      ipAddress,
      userAgent,
      metadata = {}
    } = options;

    const level = AUDIT_LEVELS.HIGH;
    const description = `Admin action: ${action} by admin ${adminId}`;

    await this.log({
      userId: adminId,
      event,
      level,
      description,
      metadata: {
        targetUserId,
        action,
        ...metadata
      },
      ipAddress,
      userAgent
    });
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

/**
 * Express middleware for automatic audit logging
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware
 */
export const auditMiddleware = (options = {}) => {
  const {
    logRequests = true,
    logResponses = false,
    sensitiveFields = ['password', 'token', 'secret'],
    excludePaths = ['/health', '/metrics']
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Log request
    if (logRequests && !excludePaths.includes(req.path)) {
      const requestData = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null
      };

      // Remove sensitive fields from request body
      const sanitizedBody = { ...req.body };
      sensitiveFields.forEach(field => {
        if (sanitizedBody[field]) {
          sanitizedBody[field] = '[REDACTED]';
        }
      });

      auditLogger.log({
        event: 'API_REQUEST',
        level: AUDIT_LEVELS.INFO,
        description: `API request: ${req.method} ${req.url}`,
        metadata: {
          requestData,
          body: sanitizedBody
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Log response
    if (logResponses) {
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        auditLogger.log({
          event: 'API_RESPONSE',
          level: AUDIT_LEVELS.INFO,
          description: `API response: ${req.method} ${req.url}`,
          metadata: {
            statusCode: res.statusCode,
            responseTime,
            dataLength: data ? data.length : 0
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        originalSend.call(this, data);
      };
    }

    next();
  };
};

/**
 * Audit log queries
 */
export const auditQueries = {
  /**
   * Get audit logs with filtering
   * @param {Object} filters - Filter options
   * @param {Object} options - Query options
   * @returns {Object} - Audit logs and pagination
   */
  async getAuditLogs(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.event) where.event = filters.event;
    if (filters.level) where.level = filters.level;
    if (filters.startDate) where.timestamp = { gte: filters.startDate };
    if (filters.endDate) {
      where.timestamp = {
        ...where.timestamp,
        lte: filters.endDate
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @param {Object} options - Time range options
   * @returns {Object} - Activity summary
   */
  async getUserActivitySummary(userId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date()
    } = options;

    const [activity, events] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['event'],
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { event: true }
      }),
      prisma.auditLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 20
      })
    ]);

    return {
      activity: activity.map(item => ({
        event: item.event,
        count: item._count.event
      })),
      recentEvents: events
    };
  }
};

export {
  auditLogger,
  AUDIT_LEVELS,
  AUDIT_EVENTS,
  auditMiddleware,
  auditQueries
};

export default auditLogger;



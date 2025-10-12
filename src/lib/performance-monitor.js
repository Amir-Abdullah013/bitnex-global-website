/**
 * Performance Monitor for Bitnex Global
 * Real-time performance monitoring and optimization
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = {
      responseTime: 1000, // 1 second
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8, // 80%
      errorRate: 0.05 // 5%
    };
  }

  /**
   * Start timing a request
   * @param {string} requestId - Unique request identifier
   * @param {Object} metadata - Request metadata
   */
  startRequest(requestId, metadata = {}) {
    this.metrics.set(requestId, {
      startTime: Date.now(),
      metadata,
      status: 'pending'
    });
  }

  /**
   * End timing a request
   * @param {string} requestId - Unique request identifier
   * @param {Object} result - Request result
   */
  endRequest(requestId, result = {}) {
    const metric = this.metrics.get(requestId);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const finalMetric = {
      ...metric,
      endTime,
      duration,
      status: 'completed',
      result
    };

    this.metrics.set(requestId, finalMetric);

    // Check for performance issues
    this.checkPerformanceThresholds(finalMetric);

    // Clean up old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Record an error
   * @param {string} requestId - Request identifier
   * @param {Error} error - Error object
   */
  recordError(requestId, error) {
    const metric = this.metrics.get(requestId);
    if (!metric) return;

    metric.status = 'error';
    metric.error = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };

    this.metrics.set(requestId, metric);
  }

  /**
   * Check performance thresholds
   * @param {Object} metric - Performance metric
   */
  checkPerformanceThresholds(metric) {
    const issues = [];

    // Check response time
    if (metric.duration > this.thresholds.responseTime) {
      issues.push({
        type: 'SLOW_RESPONSE',
        severity: 'WARNING',
        message: `Response time ${metric.duration}ms exceeds threshold ${this.thresholds.responseTime}ms`,
        metric
      });
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
    if (memoryRatio > this.thresholds.memoryUsage) {
      issues.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'WARNING',
        message: `Memory usage ${(memoryRatio * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.memoryUsage * 100)}%`,
        metric: { memoryUsage, ratio: memoryRatio }
      });
    }

    // Add issues to alerts
    issues.forEach(issue => {
      this.alerts.push({
        ...issue,
        timestamp: Date.now(),
        requestId: metric.metadata?.requestId
      });
    });
  }

  /**
   * Get performance statistics
   * @param {Object} options - Query options
   * @returns {Object} - Performance statistics
   */
  getStats(options = {}) {
    const {
      timeRange = 60 * 60 * 1000, // 1 hour
      includeErrors = true
    } = options;

    const cutoffTime = Date.now() - timeRange;
    const recentMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.startTime > cutoffTime);

    const completedMetrics = recentMetrics.filter(m => m.status === 'completed');
    const errorMetrics = recentMetrics.filter(m => m.status === 'error');

    const stats = {
      totalRequests: recentMetrics.length,
      completedRequests: completedMetrics.length,
      errorRequests: errorMetrics.length,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errorRate: 0,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };

    if (completedMetrics.length > 0) {
      const responseTimes = completedMetrics.map(m => m.duration);
      stats.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      stats.minResponseTime = Math.min(...responseTimes);
      stats.maxResponseTime = Math.max(...responseTimes);
    }

    if (recentMetrics.length > 0) {
      stats.errorRate = errorMetrics.length / recentMetrics.length;
    }

    return stats;
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
    
    for (const [requestId, metric] of this.metrics.entries()) {
      if (metric.startTime < cutoffTime) {
        this.metrics.delete(requestId);
      }
    }

    // Clean up old alerts
    const alertCutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.alerts = this.alerts.filter(alert => alert.timestamp > alertCutoffTime);
  }

  /**
   * Get slow queries
   * @param {number} threshold - Response time threshold in ms
   * @returns {Array} - Slow queries
   */
  getSlowQueries(threshold = 1000) {
    return Array.from(this.metrics.values())
      .filter(metric => metric.status === 'completed' && metric.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Get error summary
   * @returns {Object} - Error summary
   */
  getErrorSummary() {
    const errorMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.status === 'error');

    const errorCounts = {};
    errorMetrics.forEach(metric => {
      const errorType = metric.error?.message || 'Unknown';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    return {
      totalErrors: errorMetrics.length,
      errorTypes: errorCounts,
      recentErrors: errorMetrics.slice(-10)
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Database performance monitor
 */
export const databaseMonitor = {
  /**
   * Monitor database query performance
   * @param {string} queryName - Name of the query
   * @param {Function} queryFn - Query function to execute
   * @returns {Promise} - Query result with performance metrics
   */
  async monitorQuery(queryName, queryFn) {
    const startTime = Date.now();
    const requestId = `db_${queryName}_${Date.now()}`;

    performanceMonitor.startRequest(requestId, {
      type: 'DATABASE_QUERY',
      queryName
    });

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      performanceMonitor.endRequest(requestId, {
        queryName,
        duration,
        success: true
      });

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow database query: ${queryName} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      performanceMonitor.recordError(requestId, error);
      throw error;
    }
  },

  /**
   * Get database performance statistics
   * @returns {Object} - Database performance stats
   */
  async getDatabaseStats() {
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        LIMIT 100
      `;

      return {
        tableStats: stats,
        connectionCount: await this.getConnectionCount(),
        queryStats: performanceMonitor.getStats()
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { error: error.message };
    }
  },

  /**
   * Get database connection count
   * @returns {number} - Active connections
   */
  async getConnectionCount() {
    try {
      const result = await prisma.$queryRaw`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;
      return result[0]?.connections || 0;
    } catch (error) {
      console.error('Failed to get connection count:', error);
      return 0;
    }
  }
};

/**
 * API performance monitor
 */
export const apiMonitor = {
  /**
   * Monitor API endpoint performance
   * @param {string} endpoint - API endpoint
   * @param {Function} handler - API handler function
   * @returns {Function} - Wrapped handler
   */
  monitorEndpoint(endpoint, handler) {
    return async (req, res, next) => {
      const requestId = `api_${endpoint}_${Date.now()}`;
      
      performanceMonitor.startRequest(requestId, {
        type: 'API_REQUEST',
        endpoint,
        method: req.method,
        ip: req.ip
      });

      try {
        const result = await handler(req, res, next);
        performanceMonitor.endRequest(requestId, {
          endpoint,
          statusCode: res.statusCode,
          success: true
        });
        return result;
      } catch (error) {
        performanceMonitor.recordError(requestId, error);
        throw error;
      }
    };
  },

  /**
   * Get API performance statistics
   * @returns {Object} - API performance stats
   */
  getAPIStats() {
    const stats = performanceMonitor.getStats();
    const slowQueries = performanceMonitor.getSlowQueries();
    const errorSummary = performanceMonitor.getErrorSummary();

    return {
      ...stats,
      slowQueries,
      errorSummary,
      endpoints: this.getEndpointStats()
    };
  },

  /**
   * Get endpoint-specific statistics
   * @returns {Object} - Endpoint statistics
   */
  getEndpointStats() {
    const metrics = Array.from(performanceMonitor.metrics.values());
    const endpointStats = {};

    metrics.forEach(metric => {
      const endpoint = metric.metadata?.endpoint;
      if (!endpoint) return;

      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          totalRequests: 0,
          totalDuration: 0,
          averageDuration: 0,
          errorCount: 0,
          successCount: 0
        };
      }

      endpointStats[endpoint].totalRequests++;
      endpointStats[endpoint].totalDuration += metric.duration || 0;

      if (metric.status === 'error') {
        endpointStats[endpoint].errorCount++;
      } else if (metric.status === 'completed') {
        endpointStats[endpoint].successCount++;
      }
    });

    // Calculate averages
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.averageDuration = stats.totalDuration / stats.totalRequests;
    });

    return endpointStats;
  }
};

/**
 * Memory monitor
 */
export const memoryMonitor = {
  /**
   * Get current memory usage
   * @returns {Object} - Memory usage statistics
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      heapUtilization: usage.heapUsed / usage.heapTotal
    };
  },

  /**
   * Check if memory usage is high
   * @param {number} threshold - Memory usage threshold (0-1)
   * @returns {boolean} - True if memory usage is high
   */
  isMemoryUsageHigh(threshold = 0.8) {
    const usage = this.getMemoryUsage();
    return usage.heapUtilization > threshold;
  },

  /**
   * Force garbage collection if available
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      console.log('Garbage collection forced');
    } else {
      console.log('Garbage collection not available');
    }
  }
};

/**
 * Performance optimization utilities
 */
export const performanceOptimizer = {
  /**
   * Optimize database queries
   * @param {Object} query - Query object
   * @returns {Object} - Optimized query
   */
  optimizeQuery(query) {
    const optimized = { ...query };

    // Add indexes if needed
    if (optimized.where) {
      // Add compound indexes for common query patterns
      if (optimized.where.userId && optimized.where.status) {
        // This would benefit from a compound index
        console.log('Consider adding compound index on (userId, status)');
      }
    }

    // Limit results if not specified
    if (!optimized.take && !optimized.skip) {
      optimized.take = 100; // Default limit
    }

    return optimized;
  },

  /**
   * Batch database operations
   * @param {Array} operations - Array of database operations
   * @returns {Promise} - Batch result
   */
  async batchOperations(operations) {
    const startTime = Date.now();
    
    try {
      const result = await prisma.$transaction(operations);
      const duration = Date.now() - startTime;
      
      console.log(`Batch operation completed in ${duration}ms`);
      return result;
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  },

  /**
   * Implement query caching
   * @param {string} key - Cache key
   * @param {Function} queryFn - Query function
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise} - Cached or fresh result
   */
  async cachedQuery(key, queryFn, ttl = 300) {
    // This would integrate with the cache service
    // For now, just execute the query
    return await queryFn();
  }
};

/**
 * Performance alerting
 */
export const performanceAlerts = {
  /**
   * Check for performance issues
   * @returns {Array} - Array of alerts
   */
  checkAlerts() {
    const alerts = [];
    const stats = performanceMonitor.getStats();

    // Check response time
    if (stats.averageResponseTime > 2000) {
      alerts.push({
        type: 'HIGH_RESPONSE_TIME',
        severity: 'WARNING',
        message: `Average response time ${stats.averageResponseTime}ms is too high`,
        value: stats.averageResponseTime,
        threshold: 2000
      });
    }

    // Check error rate
    if (stats.errorRate > 0.05) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'CRITICAL',
        message: `Error rate ${(stats.errorRate * 100).toFixed(2)}% is too high`,
        value: stats.errorRate,
        threshold: 0.05
      });
    }

    // Check memory usage
    const memoryUsage = memoryMonitor.getMemoryUsage();
    if (memoryUsage.heapUtilization > 0.8) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'WARNING',
        message: `Memory usage ${(memoryUsage.heapUtilization * 100).toFixed(2)}% is too high`,
        value: memoryUsage.heapUtilization,
        threshold: 0.8
      });
    }

    return alerts;
  }
};

export {
  performanceMonitor,
  databaseMonitor,
  apiMonitor,
  memoryMonitor,
  performanceOptimizer,
  performanceAlerts
};

export default performanceMonitor;


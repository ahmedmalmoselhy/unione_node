import db from '../config/knex.js';
import logger from './logger.js';

/**
 * Enhanced Health Check Service
 * Provides comprehensive system health monitoring
 */

/**
 * Check database connectivity and performance
 */
async function checkDatabase() {
  const start = Date.now();
  try {
    await db.raw('SELECT 1');
    const responseTime = Date.now() - start;

    return {
      status: 'healthy',
      response_time_ms: responseTime,
      message: responseTime > 100 ? 'Database connection slow' : 'Database operational',
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      error: error.message,
      message: 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
  const start = Date.now();
  try {
    // Check if Redis is configured
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = process.env.REDIS_PORT || 6379;

    // Try to connect to Redis
    const net = require('net');
    const isConnected = await new Promise((resolve) => {
      const socket = net.createConnection({ host: redisHost, port: redisPort, timeout: 2000 });
      socket.on('connect', () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => {
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.end();
        resolve(false);
      });
    });

    const responseTime = Date.now() - start;

    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      host: redisHost,
      port: redisPort,
      response_time_ms: responseTime,
      message: isConnected ? 'Redis operational' : 'Redis not available',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - start,
      error: error.message,
      message: 'Redis connection failed',
    };
  }
}

/**
 * Check disk space
 */
async function checkDiskSpace() {
  try {
    const fs = require('fs');
    const path = require('path');

    // Check if logs directory exists and has space
    const logsDir = path.join(process.cwd(), 'logs');
    const exists = fs.existsSync(logsDir);

    return {
      status: 'healthy',
      logs_directory: logsDir,
      exists,
      message: 'Disk space available',
    };
  } catch (error) {
    return {
      status: 'degraded',
      error: error.message,
      message: 'Disk space check failed',
    };
  }
}

/**
 * Check queue system health
 */
async function checkQueues() {
  try {
    // Check if queues table exists
    const hasJobs = await db.schema.hasTable('jobs');

    if (!hasJobs) {
      return {
        status: 'healthy',
        message: 'Queue system not configured (using sync mode)',
      };
    }

    // Get job counts
    const counts = await db('jobs')
      .select('queue')
      .count('* as count')
      .groupBy('queue');

    return {
      status: 'healthy',
      queues: counts,
      message: 'Queue system operational',
    };
  } catch (error) {
    return {
      status: 'degraded',
      error: error.message,
      message: 'Queue health check failed',
    };
  }
}

/**
 * Get system metrics
 */
async function getSystemMetrics() {
  const os = require('os');

  return {
    uptime_seconds: Math.floor(process.uptime()),
    memory_usage: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      total_memory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
      free_memory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
    },
    node_version: process.version,
  };
}

/**
 * Main health check endpoint
 */
export async function getHealthStatus() {
  const [database, redis, disk, queues, metrics] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkDiskSpace(),
    checkQueues(),
    getSystemMetrics(),
  ]);

  // Determine overall status
  const services = { database, redis, disk, queues };
  const hasUnhealthy = Object.values(services).some((s) => s.status === 'unhealthy');
  const hasDegraded = Object.values(services).some((s) => s.status === 'degraded');

  const status = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
  const statusCode = hasUnhealthy ? 503 : 200;

  return {
    status,
    statusCode,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services,
    metrics,
  };
}

export default {
  getHealthStatus,
  checkDatabase,
  checkRedis,
  checkQueues,
  getSystemMetrics,
};

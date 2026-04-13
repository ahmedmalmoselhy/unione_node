import { success } from '../utils/response.js';
import healthService from '../services/healthService.js';
import logger from '../services/logger.js';

/**
 * GET /health
 * Comprehensive health check endpoint
 */
export async function healthCheck(req, res) {
  try {
    const health = await healthService.getHealthStatus();

    return res.status(health.statusCode).json(
      success(
        {
          status: health.status,
          timestamp: health.timestamp,
          version: health.version,
          environment: health.environment,
          services: health.services,
          metrics: health.metrics,
        },
        'Health check completed',
        health.statusCode
      )
    );
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
    });
  }
}

/**
 * GET /api/v1/admin/monitoring/logs
 * Get recent log entries (admin only)
 */
export async function getRecentLogs(req, res, next) {
  try {
    const fs = require('fs');
    const path = require('path');

    const logsDir = path.join(process.cwd(), 'logs');
    const level = req.query.level || 'error';
    const lines = parseInt(req.query.lines) || 100;

    // Find today's log file
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${level}-${today}.log`);

    if (!fs.existsSync(logFile)) {
      return res.status(200).json(
        success(
          {
            logs: [],
            message: 'No logs found for today',
          },
          'Logs retrieved',
          200
        )
      );
    }

    // Read last N lines
    const content = fs.readFileSync(logFile, 'utf-8');
    const allLines = content.split('\n').filter((line) => line.trim());
    const recentLogs = allLines.slice(-lines).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });

    return res.status(200).json(
      success(
        {
          logs: recentLogs,
          total: recentLogs.length,
          level,
          file: logFile,
        },
        'Logs retrieved',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/admin/monitoring/metrics
 * Get system metrics (admin only)
 */
export async function getMetrics(req, res, next) {
  try {
    const metrics = await healthService.getSystemMetrics();

    return res.status(200).json(success(metrics, 'Metrics retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  healthCheck,
  getRecentLogs,
  getMetrics,
};

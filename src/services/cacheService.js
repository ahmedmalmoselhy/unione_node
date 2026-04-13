import { createClient } from 'redis';
import logger from './logger.js';

/**
 * Redis Caching Service
 * Provides high-performance caching with tag-based invalidation
 */

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.client = createClient({
        url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.client.on('error', (err) => {
        logger.error('Redis cache error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('🔌 Redis cache connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn('⚠️ Redis cache connection failed, caching disabled', {
        error: error.message,
      });
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key with prefix
   * @param {string} prefix - Key prefix
   * @param {...*} parts - Key parts
   * @returns {string} Full cache key
   */
  key(prefix, ...parts) {
    return `unione:${prefix}:${parts.filter(p => p != null).join(':')}`;
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value or null
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set cache value with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  /**
   * Get or set cache (with callback for cache miss)
   * @param {string} key - Cache key
   * @param {Function} callback - Function to call on cache miss
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<*>}
   */
  async remember(key, callback, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete cache key
   * @param {string} key - Cache key
   */
  async forget(key) {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache forget error', { key, error: error.message });
    }
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Key pattern (e.g., 'unione:user:*')
   */
  async invalidatePattern(pattern) {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`🗑️ Invalidated ${keys.length} cache keys`, { pattern });
      }
    } catch (error) {
      logger.error('Cache invalidation error', { pattern, error: error.message });
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async flush() {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.flushDb();
      logger.warn('🗑️ Cache flushed');
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return { connected: false };
    }

    try {
      const info = await this.client.info();
      const keysCount = await this.client.dbSize();

      return {
        connected: true,
        keys_count: keysCount,
        memory_used: info.match(/used_memory_human:(.+)/)?.[1] || 'unknown',
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

// Singleton instance
const cache = new CacheService();

export default cache;

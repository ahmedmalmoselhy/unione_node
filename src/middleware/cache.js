import cache from '../services/cacheService.js';
import logger from '../services/logger.js';

/**
 * Cache Middleware
 * Automatically cache GET requests with configurable TTL
 */

/**
 * Create cache middleware
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 * @param {boolean} cacheQueryParams - Include query params in cache key
 * @returns {Function} Express middleware
 */
export function cacheMiddleware(ttl = 3600, cacheQueryParams = true) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if user is authenticated (may have personalized data)
    // Remove this check if you want to cache authenticated user responses
    if (req.user) {
      return next();
    }

    try {
      // Generate cache key from URL and query params
      let cacheKey = cache.key('http', req.originalUrl);

      if (!cacheQueryParams && req.query) {
        cacheKey = cache.key('http', req.path);
      }

      // Try to get cached response
      const cached = await cache.get(cacheKey);

      if (cached) {
        logger.debug('💾 Cache hit', { url: req.originalUrl });
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.status(cached.status).json(cached.data);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, {
            status: res.statusCode,
            data: body,
          }, ttl).catch(err => {
            logger.error('Failed to cache response', { error: err.message });
          });
        }

        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
}

/**
 * Cache invalidation middleware for mutating requests
 * Automatically invalidates related cache on POST/PUT/PATCH/DELETE
 */
export function cacheInvalidationMiddleware() {
  return async (req, res, next) => {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!mutatingMethods.includes(req.method)) {
      return next();
    }

    // Store original response method
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Invalidate cache on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract resource type from URL
        const match = req.path.match(/\/api\/v1\/([^/]+)/);
        if (match) {
          const resourceType = match[1];
          const pattern = cache.key(resourceType, '*');

          cache.invalidatePattern(pattern).catch(err => {
            logger.error('Failed to invalidate cache', { error: err.message });
          });

          logger.debug(`🗑️ Invalidated cache for ${resourceType}`, {
            method: req.method,
            url: req.path,
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

export default {
  cacheMiddleware,
  cacheInvalidationMiddleware,
};

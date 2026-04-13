import { success } from '../utils/response.js';
import cache from '../services/cacheService.js';

/**
 * GET /api/v1/admin/cache/stats
 * Get cache statistics
 */
export async function getCacheStats(req, res, next) {
  try {
    const stats = await cache.getStats();
    return res.status(200).json(success(stats, 'Cache stats retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/v1/admin/cache
 * Clear all cache (admin only)
 */
export async function clearCache(req, res, next) {
  try {
    await cache.flush();
    return res.status(200).json(success({ flushed: true }, 'Cache cleared successfully', 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/v1/admin/cache/pattern
 * Invalidate cache by pattern
 */
export async function invalidatePattern(req, res, next) {
  try {
    const { pattern } = req.body;

    if (!pattern) {
      return res.status(422).json({ error: 'Pattern is required' });
    }

    await cache.invalidatePattern(pattern);
    return res.status(200).json(success({ invalidated: true, pattern }, 'Cache invalidated', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  getCacheStats,
  clearCache,
  invalidatePattern,
};

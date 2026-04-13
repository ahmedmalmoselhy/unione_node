import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import cacheController from '../controllers/cacheController.js';

const router = express.Router();

// All cache management routes require admin authentication
router.use(authenticate);
router.use(authorizeAny(['admin', 'faculty_admin', 'department_admin']));

// Cache statistics
router.get('/stats', cacheController.getCacheStats);

// Clear all cache
router.delete('/', cacheController.clearCache);

// Invalidate cache by pattern
router.delete('/pattern', cacheController.invalidatePattern);

export default router;

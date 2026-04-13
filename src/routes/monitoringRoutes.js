import express from 'express';
import monitoringController from '../controllers/monitoringController.js';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { httpLogger } from '../services/logger.js';

const router = express.Router();

// Public health check
router.get('/health', monitoringController.healthCheck);

// Admin-only monitoring routes
router.use(authenticate);
router.use(authorizeAny(['admin', 'faculty_admin', 'department_admin']));

// Recent logs
router.get('/logs', monitoringController.getRecentLogs);

// System metrics
router.get('/metrics', monitoringController.getMetrics);

export default router;

// Export HTTP logger middleware for use in server.js
export { httpLogger };

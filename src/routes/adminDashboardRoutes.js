import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import { auditLogs, dashboardStats } from '../controllers/adminDashboardController.js';
import { adminAuditLogsQuerySchema, adminDashboardStatsQuerySchema } from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/stats', validate(adminDashboardStatsQuerySchema, 'query'), dashboardStats);
router.get('/audit-logs', validate(adminAuditLogsQuerySchema, 'query'), auditLogs);

export default router;
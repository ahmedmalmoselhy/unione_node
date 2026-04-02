import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import { auditLogs, ratings, schedules } from '../controllers/adminReportsController.js';
import { adminAuditLogsQuerySchema, adminAnalyticsQuerySchema, adminSectionListQuerySchema } from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/audit-logs', validate(adminAuditLogsQuerySchema, 'query'), auditLogs);
router.get('/ratings', validate(adminAnalyticsQuerySchema, 'query'), ratings);
router.get('/schedules', validate(adminSectionListQuerySchema, 'query'), schedules);

export default router;
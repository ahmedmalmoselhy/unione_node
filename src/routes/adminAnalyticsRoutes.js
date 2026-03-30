import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import { ratingsSummary, attendanceSummary } from '../controllers/adminAnalyticsController.js';
import { adminAnalyticsQuerySchema } from '../validators/adminValidators.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate, authorizeAny('admin', 'super_admin'));

router.get('/ratings', validate(adminAnalyticsQuerySchema, 'query'), ratingsSummary);
router.get('/attendance', validate(adminAnalyticsQuerySchema, 'query'), attendanceSummary);

export default router;

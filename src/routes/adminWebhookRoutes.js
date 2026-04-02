import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import { deliveries, failedDeliveries } from '../controllers/adminWebhookController.js';
import { adminFailedWebhookQuerySchema, adminWebhookIdParamSchema } from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/:webhookId/deliveries', validate(adminWebhookIdParamSchema, 'params'), validate(adminFailedWebhookQuerySchema, 'query'), deliveries);
router.get('/failed', validate(adminFailedWebhookQuerySchema, 'query'), failedDeliveries);

export default router;

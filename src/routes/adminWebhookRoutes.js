import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import { failedDeliveries } from '../controllers/adminWebhookController.js';
import { adminFailedWebhookQuerySchema } from '../validators/adminValidators.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate, authorizeAny('admin', 'super_admin'));

router.get('/failed', validate(adminFailedWebhookQuerySchema, 'query'), failedDeliveries);

export default router;

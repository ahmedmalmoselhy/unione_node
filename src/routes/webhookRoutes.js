import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import {
  listWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from '../controllers/webhookController.js';
import {
  webhookIdParamSchema,
  createWebhookSchema,
  updateWebhookSchema,
} from '../validators/webhookValidators.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

router.get('/', listWebhooks);
router.post('/', writeLimiter, validate(createWebhookSchema), createWebhook);
router.patch('/:id', writeLimiter, validate(webhookIdParamSchema, 'params'), validate(updateWebhookSchema), updateWebhook);
router.delete('/:id', writeLimiter, validate(webhookIdParamSchema, 'params'), deleteWebhook);

export default router;

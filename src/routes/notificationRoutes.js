import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { validate } from '../utils/validator.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { notificationIdParamSchema } from '../validators/notificationValidators.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

router.get('/', listNotifications);
router.post('/read-all', markAllNotificationsRead);
router.post('/:id/read', validate(notificationIdParamSchema, 'params'), markNotificationRead);
router.delete('/:id', validate(notificationIdParamSchema, 'params'), deleteNotification);

export default router;

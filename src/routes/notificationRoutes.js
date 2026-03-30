import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { validate } from '../utils/validator.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  listNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/notificationController.js';
import { notificationIdParamSchema } from '../validators/notificationValidators.js';
import { updateNotificationPreferencesSchema } from '../validators/notificationPreferenceValidators.js';
import { writeLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

router.get('/', listNotifications);
router.get('/preferences', listNotificationPreferences);
router.put('/preferences', writeLimiter, validate(updateNotificationPreferencesSchema), updateNotificationPreferences);
router.post('/read-all', markAllNotificationsRead);
router.post('/:id/read', validate(notificationIdParamSchema, 'params'), markNotificationRead);
router.delete('/:id', validate(notificationIdParamSchema, 'params'), deleteNotification);

export default router;

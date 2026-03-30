import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { validate } from '../utils/validator.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  markAnnouncementRead,
} from '../controllers/announcementController.js';
import {
  announcementIdParamSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../validators/announcementValidators.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate);

router.get('/', listAnnouncements);
router.post('/:id/read', validate(announcementIdParamSchema, 'params'), markAnnouncementRead);
router.post('/', validate(createAnnouncementSchema, 'body'), createAnnouncement);
router.patch('/:id', validate(announcementIdParamSchema, 'params'), validate(updateAnnouncementSchema, 'body'), updateAnnouncement);
router.delete('/:id', validate(announcementIdParamSchema, 'params'), deleteAnnouncement);

export default router;

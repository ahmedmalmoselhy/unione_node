import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import avatarController from '../controllers/avatarController.js';

const router = express.Router();

// All avatar routes require authentication
router.use(authenticate);

// Upload avatar (multipart/form-data)
router.post(
  '/avatar',
  upload.single('avatar'),
  handleUploadError,
  avatarController.uploadAvatar
);

// Get user avatar
router.get('/avatar/:userId', avatarController.getAvatar);

// Delete avatar
router.delete('/avatar', avatarController.deleteAvatar);

export default router;

import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import realtimeController from '../controllers/realtimeController.js';

const router = express.Router();

// All realtime routes require authentication
router.use(authenticate);

// Real-time status
router.get('/status', realtimeController.getStatus);

// Test notification
router.post('/test', realtimeController.sendTestNotification);

export default router;

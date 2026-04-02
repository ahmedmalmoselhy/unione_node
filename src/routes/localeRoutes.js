import express from 'express';
import { getLocale, setLocale } from '../controllers/localeController.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.use(apiLimiter);
router.get('/', getLocale);
router.put('/', writeLimiter, setLocale);

export default router;
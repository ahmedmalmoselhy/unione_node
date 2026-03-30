import express from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { validate } from '../utils/validator.js';
import { loginSchema } from '../validators/authValidators.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;

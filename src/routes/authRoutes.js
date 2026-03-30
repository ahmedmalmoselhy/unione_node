import express from 'express';
import {
	login,
	logout,
	me,
	tokens,
	logoutAll,
	revokeToken,
	forgotPassword,
	resetPassword,
	changePassword,
	updateProfile,
} from '../controllers/authController.js';
import { validate } from '../utils/validator.js';
import {
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	changePasswordSchema,
	updateProfileSchema,
} from '../validators/authValidators.js';
import { tokenIdParamSchema } from '../validators/tokenValidators.js';
import authenticate from '../middleware/authenticate.js';
import {
	apiLimiter,
	loginLimiter,
	passwordLimiter,
	writeLimiter,
} from '../middleware/rateLimiters.js';

const router = express.Router();

router.use(apiLimiter);

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/forgot-password', passwordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/logout', writeLimiter, authenticate, logout);
router.get('/me', authenticate, me);
router.post('/change-password', writeLimiter, authenticate, validate(changePasswordSchema), changePassword);
router.patch('/profile', writeLimiter, authenticate, validate(updateProfileSchema), updateProfile);
router.get('/tokens', authenticate, tokens);
router.delete('/tokens', writeLimiter, authenticate, logoutAll);
router.delete('/tokens/:tokenId', writeLimiter, authenticate, validate(tokenIdParamSchema, 'params'), revokeToken);

export default router;

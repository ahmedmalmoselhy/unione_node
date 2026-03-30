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

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.get('/tokens', authenticate, tokens);
router.delete('/tokens', authenticate, logoutAll);
router.delete('/tokens/:tokenId', authenticate, validate(tokenIdParamSchema, 'params'), revokeToken);

export default router;

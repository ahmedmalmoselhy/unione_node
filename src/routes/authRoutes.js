import express from 'express';
import {
	login,
	logout,
	me,
	tokens,
	logoutAll,
	revokeToken,
} from '../controllers/authController.js';
import { validate } from '../utils/validator.js';
import { loginSchema } from '../validators/authValidators.js';
import { tokenIdParamSchema } from '../validators/tokenValidators.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.get('/tokens', authenticate, tokens);
router.delete('/tokens', authenticate, logoutAll);
router.delete('/tokens/:tokenId', authenticate, validate(tokenIdParamSchema, 'params'), revokeToken);

export default router;

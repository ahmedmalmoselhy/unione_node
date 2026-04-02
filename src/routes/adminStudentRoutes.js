import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import { index, show, store, update, transfer, destroy } from '../controllers/adminStudentController.js';
import { entityIdParamSchema, adminStudentListQuerySchema, adminStudentCreateSchema, adminStudentUpdateSchema, adminStudentTransferSchema } from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/', validate(adminStudentListQuerySchema, 'query'), index);
router.get('/:id', validate(entityIdParamSchema, 'params'), show);
router.post('/', writeLimiter, validate(adminStudentCreateSchema), store);
router.patch('/:id', writeLimiter, validate(entityIdParamSchema, 'params'), validate(adminStudentUpdateSchema), update);
router.post('/:id/transfer', writeLimiter, validate(entityIdParamSchema, 'params'), validate(adminStudentTransferSchema), transfer);
router.delete('/:id', writeLimiter, validate(entityIdParamSchema, 'params'), destroy);

export default router;
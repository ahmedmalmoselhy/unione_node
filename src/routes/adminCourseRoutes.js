import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import { index, show, store, update, destroy } from '../controllers/adminCourseController.js';
import { entityIdParamSchema, adminCourseListQuerySchema, adminCourseCreateSchema, adminCourseUpdateSchema } from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/', validate(adminCourseListQuerySchema, 'query'), index);
router.get('/:id', validate(entityIdParamSchema, 'params'), show);
router.post('/', writeLimiter, validate(adminCourseCreateSchema), store);
router.patch('/:id', writeLimiter, validate(entityIdParamSchema, 'params'), validate(adminCourseUpdateSchema), update);
router.delete('/:id', writeLimiter, validate(entityIdParamSchema, 'params'), destroy);

export default router;
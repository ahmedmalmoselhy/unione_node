import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import {
  storeFacultyAdmin,
  removeFacultyAdmin,
  storeDepartmentAdmin,
  removeDepartmentAdmin,
  storeDepartmentHead,
  removeDepartmentHead,
} from '../controllers/adminAssignmentController.js';
import { entityIdParamSchema, adminAssignUserSchema } from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.post('/faculties/:id/assign-admin', writeLimiter, validate(entityIdParamSchema, 'params'), validate(adminAssignUserSchema), storeFacultyAdmin);
router.delete('/faculties/:id/assign-admin', writeLimiter, validate(entityIdParamSchema, 'params'), removeFacultyAdmin);

router.post('/departments/:id/assign-admin', writeLimiter, validate(entityIdParamSchema, 'params'), validate(adminAssignUserSchema), storeDepartmentAdmin);
router.delete('/departments/:id/assign-admin', writeLimiter, validate(entityIdParamSchema, 'params'), removeDepartmentAdmin);

router.post('/departments/:id/assign-head', writeLimiter, validate(entityIdParamSchema, 'params'), validate(adminAssignUserSchema), storeDepartmentHead);
router.delete('/departments/:id/assign-head', writeLimiter, validate(entityIdParamSchema, 'params'), removeDepartmentHead);

export default router;
import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import {
  students,
  professors,
  employees,
  enrollments,
  grades,
} from '../controllers/adminExportController.js';
import { adminExportQuerySchema } from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/students', validate(adminExportQuerySchema, 'query'), students);
router.get('/professors', validate(adminExportQuerySchema, 'query'), professors);
router.get('/employees', validate(adminExportQuerySchema, 'query'), employees);
router.get('/enrollments', validate(adminExportQuerySchema, 'query'), enrollments);
router.get('/grades', validate(adminExportQuerySchema, 'query'), grades);

export default router;
import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import {
  university,
  faculties,
  departments,
} from '../controllers/organizationController.js';
import {
  facultyListSchema,
  departmentListSchema,
} from '../validators/organizationValidators.js';

const router = express.Router();

const elevatedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(authenticate, authorizeAny(...elevatedRoles));

router.get('/university', university);
router.get('/faculties', validate(facultyListSchema, 'query'), faculties);
router.get('/departments', validate(departmentListSchema, 'query'), departments);

export default router;

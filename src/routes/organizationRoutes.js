import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import {
  university,
  faculties,
  departments,
  vicePresidents,
  updateUniversity,
  createFaculty,
  updateFaculty,
  createDepartment,
  updateDepartment,
  createVicePresident,
  updateVicePresident,
  deleteVicePresident,
} from '../controllers/organizationController.js';
import {
  facultyListSchema,
  departmentListSchema,
  entityIdParamSchema,
  updateUniversitySchema,
  createFacultySchema,
  updateFacultySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createVicePresidentSchema,
  updateVicePresidentSchema,
} from '../validators/organizationValidators.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

const elevatedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];
const highRoles = ['admin', 'university_admin'];
const departmentWriteRoles = ['admin', 'university_admin', 'faculty_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...elevatedRoles));

router.get('/university', university);
router.patch('/university', writeLimiter, authorizeAny(...highRoles), validate(updateUniversitySchema), updateUniversity);

router.get('/university/vice-presidents', vicePresidents);
router.post('/university/vice-presidents', writeLimiter, authorizeAny(...highRoles), validate(createVicePresidentSchema), createVicePresident);
router.patch('/university/vice-presidents/:id', writeLimiter, authorizeAny(...highRoles), validate(entityIdParamSchema, 'params'), validate(updateVicePresidentSchema), updateVicePresident);
router.delete('/university/vice-presidents/:id', writeLimiter, authorizeAny(...highRoles), validate(entityIdParamSchema, 'params'), deleteVicePresident);

router.get('/faculties', validate(facultyListSchema, 'query'), faculties);
router.post('/faculties', writeLimiter, authorizeAny(...highRoles), validate(createFacultySchema), createFaculty);
router.patch('/faculties/:id', writeLimiter, authorizeAny(...highRoles), validate(entityIdParamSchema, 'params'), validate(updateFacultySchema), updateFaculty);

router.get('/departments', validate(departmentListSchema, 'query'), departments);
router.post('/departments', writeLimiter, authorizeAny(...departmentWriteRoles), validate(createDepartmentSchema), createDepartment);
router.patch('/departments/:id', writeLimiter, authorizeAny(...departmentWriteRoles), validate(entityIdParamSchema, 'params'), validate(updateDepartmentSchema), updateDepartment);

export default router;

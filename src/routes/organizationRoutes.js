import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import {
  university,
  faculties,
  departments,
  updateUniversity,
  createFaculty,
  updateFaculty,
  createDepartment,
  updateDepartment,
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
} from '../validators/organizationValidators.js';

const router = express.Router();

const elevatedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];
const highRoles = ['admin', 'university_admin'];
const departmentWriteRoles = ['admin', 'university_admin', 'faculty_admin'];

router.use(authenticate, authorizeAny(...elevatedRoles));

router.get('/university', university);
router.patch('/university', authorizeAny(...highRoles), validate(updateUniversitySchema), updateUniversity);

router.get('/faculties', validate(facultyListSchema, 'query'), faculties);
router.post('/faculties', authorizeAny(...highRoles), validate(createFacultySchema), createFaculty);
router.patch('/faculties/:id', authorizeAny(...highRoles), validate(entityIdParamSchema, 'params'), validate(updateFacultySchema), updateFaculty);

router.get('/departments', validate(departmentListSchema, 'query'), departments);
router.post('/departments', authorizeAny(...departmentWriteRoles), validate(createDepartmentSchema), createDepartment);
router.patch('/departments/:id', authorizeAny(...departmentWriteRoles), validate(entityIdParamSchema, 'params'), validate(updateDepartmentSchema), updateDepartment);

export default router;

import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { students, professors, grades } from '../controllers/adminImportTemplateController.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/students', students);
router.get('/professors', professors);
router.get('/grades', grades);

export default router;
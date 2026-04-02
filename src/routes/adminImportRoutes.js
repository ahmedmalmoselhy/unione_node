import express from 'express';
import multer from 'multer';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import { students, professors, grades } from '../controllers/adminImportController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.post('/students', upload.single('file'), students);
router.post('/professors', upload.single('file'), professors);
router.post('/grades', upload.single('file'), grades);

export default router;
import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import { profile, enrollments, grades } from '../controllers/studentController.js';
import {
  studentEnrollmentsQuerySchema,
  studentGradesQuerySchema,
} from '../validators/studentValidators.js';

const router = express.Router();

router.use(authenticate, authorizeAny('student'));

router.get('/profile', profile);
router.get('/enrollments', validate(studentEnrollmentsQuerySchema, 'query'), enrollments);
router.get('/grades', validate(studentGradesQuerySchema, 'query'), grades);

export default router;

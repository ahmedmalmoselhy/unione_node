import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import { profile, enrollments, grades, enroll, drop } from '../controllers/studentController.js';
import {
  studentEnrollmentsQuerySchema,
  studentGradesQuerySchema,
  studentEnrollSchema,
  studentEnrollmentIdParamSchema,
} from '../validators/studentValidators.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate, authorizeAny('student'));

router.get('/profile', profile);
router.get('/enrollments', validate(studentEnrollmentsQuerySchema, 'query'), enrollments);
router.post('/enrollments', writeLimiter, validate(studentEnrollSchema), enroll);
router.delete('/enrollments/:id', writeLimiter, validate(studentEnrollmentIdParamSchema, 'params'), drop);
router.get('/grades', validate(studentGradesQuerySchema, 'query'), grades);

export default router;

import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import {
  profile,
  sections,
  schedule,
  sectionStudents,
  sectionGrades,
  submitSectionGrades,
  attendanceSessions,
  createAttendanceSession,
  attendanceSessionDetails,
  updateAttendanceSession,
} from '../controllers/professorController.js';
import {
  professorSectionsQuerySchema,
  professorSectionIdParamSchema,
  professorSectionAndSessionParamSchema,
  submitSectionGradesSchema,
  createAttendanceSessionSchema,
  updateAttendanceSessionSchema,
} from '../validators/professorValidators.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.use(apiLimiter);
router.use(authenticate, authorizeAny('professor'));

router.get('/profile', profile);
router.get('/sections', validate(professorSectionsQuerySchema, 'query'), sections);
router.get('/schedule', validate(professorSectionsQuerySchema, 'query'), schedule);
router.get('/sections/:id/students', validate(professorSectionIdParamSchema, 'params'), sectionStudents);
router.get('/sections/:id/grades', validate(professorSectionIdParamSchema, 'params'), sectionGrades);
router.post('/sections/:id/grades', writeLimiter, validate(professorSectionIdParamSchema, 'params'), validate(submitSectionGradesSchema), submitSectionGrades);
router.get('/sections/:id/attendance', validate(professorSectionIdParamSchema, 'params'), attendanceSessions);
router.post('/sections/:id/attendance', writeLimiter, validate(professorSectionIdParamSchema, 'params'), validate(createAttendanceSessionSchema), createAttendanceSession);
router.get('/sections/:id/attendance/:sessionId', validate(professorSectionAndSessionParamSchema, 'params'), attendanceSessionDetails);
router.put('/sections/:id/attendance/:sessionId', writeLimiter, validate(professorSectionAndSessionParamSchema, 'params'), validate(updateAttendanceSessionSchema), updateAttendanceSession);

export default router;

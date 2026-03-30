import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import {
  profile,
  enrollments,
  grades,
  transcript,
  transcriptPdf,
  schedule,
  scheduleIcs,
  attendance,
  ratings,
  submitRating,
  sectionAnnouncements,
  enroll,
  drop,
  waitlist,
  removeWaitlist,
} from '../controllers/studentController.js';
import {
  studentEnrollmentsQuerySchema,
  studentGradesQuerySchema,
  studentAttendanceQuerySchema,
  studentRatingsQuerySchema,
  studentRatingCreateSchema,
  studentEnrollSchema,
  studentEnrollmentIdParamSchema,
  studentWaitlistSectionParamSchema,
  studentSectionIdParamSchema,
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
router.get('/transcript', validate(studentGradesQuerySchema, 'query'), transcript);
router.get('/transcript/pdf', validate(studentGradesQuerySchema, 'query'), transcriptPdf);
router.get('/schedule', validate(studentGradesQuerySchema, 'query'), schedule);
router.get('/schedule/ics', validate(studentGradesQuerySchema, 'query'), scheduleIcs);
router.get('/attendance', validate(studentAttendanceQuerySchema, 'query'), attendance);
router.get('/ratings', validate(studentRatingsQuerySchema, 'query'), ratings);
router.post('/ratings', writeLimiter, validate(studentRatingCreateSchema), submitRating);
router.get('/sections/:sectionId/announcements', validate(studentSectionIdParamSchema, 'params'), sectionAnnouncements);
router.get('/waitlist', waitlist);
router.delete('/waitlist/:sectionId', writeLimiter, validate(studentWaitlistSectionParamSchema, 'params'), removeWaitlist);

export default router;

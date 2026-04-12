import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import advancedAnalyticsController from '../controllers/advancedAnalyticsController.js';

const router = express.Router();

// All analytics routes require admin authentication
router.use(authenticate);
router.use(authorizeAny(['admin', 'faculty_admin', 'department_admin']));

// Enrollment trends
router.get('/enrollment-trends', advancedAnalyticsController.getEnrollmentTrends);

// Student performance prediction
router.get('/student-performance/:studentId', advancedAnalyticsController.getStudentPerformance);

// Course demand analysis
router.get('/course-demand', advancedAnalyticsController.getCourseDemand);

// Professor workload
router.get('/professor-workload', advancedAnalyticsController.getProfessorWorkload);

// Attendance analytics
router.get('/attendance', advancedAnalyticsController.getAttendanceAnalytics);

export default router;

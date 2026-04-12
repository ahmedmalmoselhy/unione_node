import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import bulkOperationController from '../controllers/bulkOperationController.js';

const router = express.Router();

// All bulk operation routes require admin authentication
router.use(authenticate);
router.use(authorizeAny(['admin', 'faculty_admin', 'department_admin']));

// Bulk enrollment
router.post('/enroll', bulkOperationController.enrollStudents);

// Bulk grade updates
router.post('/grades', bulkOperationController.updateGrades);

// Bulk student transfers
router.post('/transfer', bulkOperationController.transferStudents);

// Bulk enrollment deletion
router.delete('/enrollments', bulkOperationController.deleteEnrollments);

// Bulk exam schedule publishing
router.post('/exam-schedules', bulkOperationController.publishExamSchedules);

export default router;

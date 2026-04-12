const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authenticate } = require('../middleware/authenticate');
const { authorizeAny } = require('../middleware/authorize');

// All queue endpoints require admin authentication
router.use(authenticate);
router.use(authorizeAny(['admin', 'faculty_admin', 'department_admin']));

// Queue status
router.get('/status', queueController.getQueueStatus);

// Failed jobs
router.get('/failed', queueController.getFailedJobs);

// Retry failed job
router.post('/:jobId/retry', queueController.retryFailedJob);

module.exports = router;

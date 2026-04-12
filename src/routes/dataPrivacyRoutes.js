import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import dataPrivacyController from '../controllers/dataPrivacyController.js';

const router = express.Router();

// All privacy routes require authentication
router.use(authenticate);

// Export personal data
router.get('/export', dataPrivacyController.exportData);

// Get data processing summary
router.get('/summary', dataPrivacyController.getDataSummary);

// Anonymize account
router.post('/anonymize', dataPrivacyController.anonymizeAccount);

// Delete account permanently
router.delete('/account', dataPrivacyController.deleteAccount);

export default router;

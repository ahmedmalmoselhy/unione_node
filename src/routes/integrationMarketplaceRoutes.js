import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import integrationMarketplaceController from '../controllers/integrationMarketplaceController.js';

const router = express.Router();

// All integration routes require admin authentication
router.use(authenticate);
router.use(authorizeAny(['admin', 'faculty_admin', 'department_admin']));

// List all integrations
router.get('/', integrationMarketplaceController.listIntegrations);

// Get specific integration status
router.get('/:id/status', integrationMarketplaceController.getIntegrationStatus);

// Test integration connection
router.get('/:id/test', integrationMarketplaceController.testIntegration);

// Sync data to integration
router.post('/:id/sync', integrationMarketplaceController.syncIntegration);

export default router;

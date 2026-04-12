import { success } from '../utils/response.js';
import MoodleIntegration from '../integrations/moodleIntegration.js';
import SSOIntegration from '../integrations/ssoIntegration.js';
import logger from '../utils/logger.js';

// Integration instances
const integrations = {
  moodle: new MoodleIntegration(),
  sso_saml: new SSOIntegration(),
};

// Initialize integrations from config
function initializeIntegrations() {
  Object.keys(integrations).forEach((key) => {
    const config = {
      enabled: process.env[`${key.toUpperCase()}_ENABLED`] === 'true',
      url: process.env[`${key.toUpperCase()}_URL`],
      token: process.env[`${key.toUpperCase()}_TOKEN`],
      metadataUrl: process.env[`${key.toUpperCase()}_METADATA_URL`],
      entityId: process.env[`${key.toUpperCase()}_ENTITY_ID`],
    };

    integrations[key].initialize(config);
  });
}

// Initialize on module load
initializeIntegrations();

/**
 * GET /api/v1/admin/integrations
 * List all available integrations
 */
export async function listIntegrations(req, res, next) {
  try {
    const integrationStatuses = {};

    for (const [key, integration] of Object.entries(integrations)) {
      integrationStatuses[key] = await integration.getStatus();
    }

    return res.status(200).json(
      success(
        {
          integrations: integrationStatuses,
          available: Object.keys(integrations),
        },
        'Integrations retrieved',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/admin/integrations/:id/test
 * Test an integration connection
 */
export async function testIntegration(req, res, next) {
  try {
    const { id } = req.params;
    const integration = integrations[id];

    if (!integration) {
      return res.status(404).json({
        error: `Integration '${id}' not found`,
        available: Object.keys(integrations),
      });
    }

    const connected = await integration.testConnection();

    return res.status(200).json(
      success(
        {
          integration: id,
          connected,
          message: connected ? 'Connection successful' : 'Connection failed',
        },
        'Integration test completed',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/integrations/:id/sync
 * Sync data to an integration
 */
export async function syncIntegration(req, res, next) {
  try {
    const { id } = req.params;
    const integration = integrations[id];

    if (!integration) {
      return res.status(404).json({
        error: `Integration '${id}' not found`,
        available: Object.keys(integrations),
      });
    }

    const data = req.body;
    const success = await integration.sync(data);

    return res.status(200).json(
      success(
        {
          integration: id,
          success,
          message: success ? 'Sync completed' : 'Sync failed',
        },
        'Integration sync completed',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/admin/integrations/:id/status
 * Get detailed integration status
 */
export async function getIntegrationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const integration = integrations[id];

    if (!integration) {
      return res.status(404).json({
        error: `Integration '${id}' not found`,
        available: Object.keys(integrations),
      });
    }

    const status = await integration.getStatus();

    return res.status(200).json(success(status, 'Integration status retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  listIntegrations,
  testIntegration,
  syncIntegration,
  getIntegrationStatus,
};

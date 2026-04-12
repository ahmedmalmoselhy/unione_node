import { success } from '../utils/response.js';
import dataPrivacyService from '../services/dataPrivacyService.js';

/**
 * GET /api/v1/privacy/export
 * Export all personal data (GDPR Article 20 - Data Portability)
 */
export async function exportData(req, res, next) {
  try {
    const userId = req.user.id;
    const data = await dataPrivacyService.exportUserData(userId);

    return res.status(200).json(
      success(
        {
          data,
          exported_at: new Date().toISOString(),
          format: 'JSON',
        },
        'Personal data exported successfully',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/privacy/summary
 * Get data processing summary
 */
export async function getDataSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const summary = await dataPrivacyService.getDataProcessingSummary(userId);

    return res.status(200).json(success(summary, 'Data processing summary', 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/privacy/anonymize
 * Anonymize user data (GDPR Article 17 - Right to be Forgotten)
 */
export async function anonymizeAccount(req, res, next) {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE') {
      return res.status(422).json({
        error: 'Confirmation required',
        message: 'You must confirm that you understand this action is irreversible',
      });
    }

    const userId = req.user.id;
    await dataPrivacyService.anonymizeUser(userId);

    // Logout user (delete current token if using sessions)
    // This would be handled by the client deleting the token

    return res.status(200).json(
      success(
        {
          anonymized: true,
          message: 'Your account has been anonymized. All personal data has been removed.',
          next_steps: 'Please log out and clear your browser data.',
        },
        'Account anonymized successfully',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/v1/privacy/account
 * Permanently delete account (IRREVERSIBLE)
 */
export async function deleteAccount(req, res, next) {
  try {
    const { confirmation, password } = req.body;

    if (confirmation !== 'PERMANENTLY_DELETE_MY_ACCOUNT') {
      return res.status(422).json({
        error: 'Confirmation required',
        message: 'You must confirm permanent account deletion',
      });
    }

    if (!password) {
      return res.status(422).json({
        error: 'Password required',
        message: 'Please enter your password to confirm deletion',
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const user = await require('../config/knex.js').default('users').where('id', req.user.id).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(403).json({
        error: 'Invalid password',
      });
    }

    await dataPrivacyService.hardDeleteUser(req.user.id);

    return res.status(200).json(
      success(
        {
          deleted: true,
          message: 'Your account has been permanently deleted.',
        },
        'Account deleted successfully',
        200
      )
    );
  } catch (error) {
    return next(error);
  }
}

export default {
  exportData,
  getDataSummary,
  anonymizeAccount,
  deleteAccount,
};

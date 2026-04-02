import { success } from '../utils/response.js';
import { listAuditLogs } from '../services/adminDashboardService.js';
import { getRatingsSummary } from '../services/adminAnalyticsService.js';
import { listSections } from '../services/adminSectionService.js';

export async function auditLogs(req, res, next) {
  try {
    const data = await listAuditLogs(req.query);
    return res.status(200).json(success(data, 'Audit logs fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function ratings(req, res, next) {
  try {
    const data = await getRatingsSummary(req.query);
    return res.status(200).json(success(data, 'Ratings report fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function schedules(req, res, next) {
  try {
    const data = await listSections(req.query, req.user);
    return res.status(200).json(success(data, 'Schedule report fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  auditLogs,
  ratings,
  schedules,
};
import { success } from '../utils/response.js';
import { getDashboardStats, listAuditLogs } from '../services/adminDashboardService.js';

export async function dashboardStats(req, res, next) {
  try {
    const data = await getDashboardStats(req.query);
    return res.status(200).json(success(data, 'Dashboard stats fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function auditLogs(req, res, next) {
  try {
    const data = await listAuditLogs(req.query);
    return res.status(200).json(success(data, 'Audit logs fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}
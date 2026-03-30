import { success } from '../utils/response.js';
import { getRatingsSummary, getAttendanceSummary } from '../services/adminAnalyticsService.js';

export async function ratingsSummary(req, res, next) {
  try {
    const data = await getRatingsSummary(req.query);
    return res.status(200).json(success(data, 'Ratings summary fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function attendanceSummary(req, res, next) {
  try {
    const data = await getAttendanceSummary(req.query);
    return res.status(200).json(success(data, 'Attendance summary fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

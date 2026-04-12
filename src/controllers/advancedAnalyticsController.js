import { success } from '../utils/response.js';
import advancedAnalyticsService from '../services/advancedAnalyticsService.js';

/**
 * GET /api/v1/admin/analytics/enrollment-trends
 * Get enrollment trends with predictions
 */
export async function getEnrollmentTrends(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 12;
    const trends = await advancedAnalyticsService.getEnrollmentTrends(months);

    return res.status(200).json(success(trends, 'Enrollment trends retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/admin/analytics/student-performance/:studentId
 * Predict student performance
 */
export async function getStudentPerformance(req, res, next) {
  try {
    const studentId = parseInt(req.params.studentId);
    const prediction = await advancedAnalyticsService.predictStudentPerformance(studentId);

    return res
      .status(200)
      .json(success(prediction, 'Student performance prediction retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/admin/analytics/course-demand
 * Get course demand analysis
 */
export async function getCourseDemand(req, res, next) {
  try {
    const demand = await advancedAnalyticsService.getCourseDemandAnalysis();

    return res.status(200).json(success(demand, 'Course demand analysis retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/admin/analytics/professor-workload
 * Get professor workload analysis
 */
export async function getProfessorWorkload(req, res, next) {
  try {
    const workload = await advancedAnalyticsService.getProfessorWorkload();

    return res.status(200).json(success(workload, 'Professor workload analysis retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/v1/admin/analytics/attendance
 * Get attendance analytics
 */
export async function getAttendanceAnalytics(req, res, next) {
  try {
    const analytics = await advancedAnalyticsService.getAttendanceAnalytics();

    return res.status(200).json(success(analytics, 'Attendance analytics retrieved', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  getEnrollmentTrends,
  getStudentPerformance,
  getCourseDemand,
  getProfessorWorkload,
  getAttendanceAnalytics,
};

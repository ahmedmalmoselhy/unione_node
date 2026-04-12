import db from '../config/knex.js';
import logger from '../utils/logger.js';

/**
 * Advanced Analytics Service
 * Provides predictive insights and forecasting
 */

/**
 * Get enrollment trends over time
 * @param {number} months - Number of months to analyze
 * @returns {Promise<object>} Enrollment trend data
 */
export async function getEnrollmentTrends(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const enrollments = await db('enrollments')
    .where('registered_at', '>=', startDate)
    .select(
      db.raw("DATE_TRUNC('month', registered_at) as month"),
      db.raw('COUNT(*) as total'),
      db.raw("COUNT(CASE WHEN status = 'registered' THEN 1 END) as active"),
      db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed"),
      db.raw("COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped")
    )
    .groupBy('month')
    .orderBy('month');

  // Calculate trend direction
  const trends = enrollments.map((row) => {
    const total = parseInt(row.total);
    const dropped = parseInt(row.dropped);
    return {
      month: row.month,
      total_enrollments: total,
      active: parseInt(row.active),
      completed: parseInt(row.completed),
      dropped,
      drop_rate: total > 0 ? Math.round((dropped / total) * 10000) / 100 : 0,
    };
  });

  // Predict next month using simple linear regression
  const prediction = predictNextMonth(trends);

  return {
    period: `${months} months`,
    historical: trends,
    prediction,
  };
}

/**
 * Predict student performance based on historical data
 * @param {number} studentId - Student ID
 * @returns {Promise<object>} Performance prediction
 */
export async function predictStudentPerformance(studentId) {
  const student = await db('students').where('id', studentId).first();

  if (!student) {
    throw new Error('Student not found');
  }

  // Get all graded enrollments
  const grades = await db('enrollments as e')
    .join('sections as s', 's.id', 'e.section_id')
    .join('grades as g', 'g.enrollment_id', 'e.id')
    .where('e.student_id', studentId)
    .whereIn('e.status', ['completed'])
    .select(
      'g.total',
      'g.letter_grade',
      'g.grade_points',
      'g.graded_at',
      's.course_id',
      'e.academic_term_id'
    )
    .orderBy('g.graded_at');

  if (grades.length === 0) {
    return {
      prediction: 'insufficient_data',
      confidence: 0,
      current_gpa: student.gpa,
      message: 'No graded courses available for prediction',
    };
  }

  // Calculate average grade
  const averageGrade = grades.reduce((sum, g) => sum + parseFloat(g.total), 0) / grades.length;

  // Calculate trend (comparing recent vs older grades)
  const trend = calculateGradeTrend(grades);

  // Predict next semester GPA
  const predictedGpa = predictNextGpa(grades, student.gpa);

  // Risk assessment
  const riskLevel = averageGrade < 60 ? 'high' : averageGrade < 70 ? 'medium' : 'low';

  // Confidence based on number of grades
  const confidence = Math.min(grades.length * 10, 95);

  return {
    student_id: studentId,
    current_gpa: student.gpa,
    predicted_next_gpa: predictedGpa,
    average_score: Math.round(averageGrade * 100) / 100,
    trend,
    risk_level: riskLevel,
    confidence,
    total_courses: grades.length,
    recommendation: getRecommendation(riskLevel, trend),
  };
}

/**
 * Get course demand analysis
 * @returns {Promise<object>} Course demand data
 */
export async function getCourseDemandAnalysis() {
  const courses = await db('courses as c')
    .leftJoin('sections as s', 's.course_id', 'c.id')
    .leftJoin('enrollments as e', function () {
      this.on('e.section_id', '=', 's.id').andOnIn('e.status', [
        'registered',
        'completed',
      ]);
    })
    .select(
      'c.id as course_id',
      'c.code',
      'c.name',
      db.raw('COUNT(DISTINCT s.id) as total_sections'),
      db.raw('COUNT(DISTINCT e.id) as total_enrollments'),
      db.raw('COALESCE(SUM(s.capacity), 0) as total_capacity')
    )
    .groupBy('c.id', 'c.code', 'c.name')
    .orderBy('total_enrollments', 'desc')
    .limit(20);

  const demandAnalysis = courses.map((course) => {
    const enrollments = parseInt(course.total_enrollments) || 0;
    const capacity = parseInt(course.total_capacity) || 1;
    const fillRate = Math.round((enrollments / capacity) * 10000) / 100;

    return {
      course_id: course.course_id,
      code: course.code,
      name: course.name,
      total_sections: parseInt(course.total_sections),
      total_enrollments: enrollments,
      total_capacity: capacity,
      fill_rate: fillRate,
      demand_level: fillRate > 90 ? 'high' : fillRate > 70 ? 'medium' : 'low',
    };
  });

  return {
    courses: demandAnalysis,
    summary: {
      total_courses_analyzed: demandAnalysis.length,
      high_demand_count: demandAnalysis.filter((c) => c.demand_level === 'high').length,
      average_fill_rate:
        demandAnalysis.length > 0
          ? Math.round(
              (demandAnalysis.reduce((sum, c) => sum + c.fill_rate, 0) /
                demandAnalysis.length) *
                100
            ) / 100
          : 0,
    },
  };
}

/**
 * Get professor workload analysis
 * @returns {Promise<object>} Workload data
 */
export async function getProfessorWorkload() {
  const professors = await db('professors as p')
    .join('users as u', 'u.id', 'p.user_id')
    .leftJoin('sections as s', function () {
      this.on('s.professor_id', '=', 'p.id').andOn('s.is_active', '=', db.raw('true'));
    })
    .select(
      'p.id as professor_id',
      db.raw("u.first_name || ' ' || u.last_name as name"),
      'p.academic_rank',
      'p.department_id',
      db.raw('COUNT(DISTINCT s.id) as active_sections'),
      db.raw('COALESCE(SUM(s.capacity), 0) as total_students')
    )
    .groupBy('p.id', 'u.first_name', 'u.last_name', 'p.academic_rank', 'p.department_id')
    .orderBy('active_sections', 'desc');

  const workloadData = professors.map((prof) => {
    const sections = parseInt(prof.active_sections);
    const students = parseInt(prof.total_students);

    return {
      professor_id: prof.professor_id,
      name: prof.name,
      academic_rank: prof.academic_rank,
      active_sections: sections,
      total_students: students,
      workload_level: sections > 5 ? 'heavy' : sections > 3 ? 'moderate' : 'light',
      students_per_section: sections > 0 ? Math.round(students / sections) : 0,
    };
  });

  // Summary statistics
  const avgSections =
    workloadData.length > 0
      ? Math.round(
          (workloadData.reduce((sum, p) => sum + p.active_sections, 0) / workloadData.length) *
            100
        ) / 100
      : 0;

  const avgStudents =
    workloadData.length > 0
      ? Math.round(
          workloadData.reduce((sum, p) => sum + p.total_students, 0) / workloadData.length
        )
      : 0;

  return {
    professors: workloadData,
    summary: {
      total_professors: workloadData.length,
      average_sections: avgSections,
      average_students_per_professor: avgStudents,
      heavy_workload_count: workloadData.filter((p) => p.workload_level === 'heavy').length,
      light_workload_count: workloadData.filter((p) => p.workload_level === 'light').length,
    },
  };
}

/**
 * Get attendance analytics
 * @returns {Promise<object>} Attendance data
 */
export async function getAttendanceAnalytics() {
  const stats = await db('attendance_records')
    .select('status')
    .count('* as count')
    .groupBy('status');

  const totalCount = stats.reduce((sum, s) => sum + parseInt(s.count), 0);

  const byStatus = stats.map((s) => ({
    status: s.status,
    count: parseInt(s.count),
    percentage: totalCount > 0 ? Math.round((parseInt(s.count) / totalCount) * 10000) / 100 : 0,
  }));

  const presentCount = byStatus.find((s) => s.status === 'present')?.count || 0;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 10000) / 100 : 0;

  return {
    by_status: byStatus,
    overall_attendance_rate: attendanceRate,
    total_records: totalCount,
  };
}

// ====================
// Helper Functions
// ====================

/**
 * Calculate grade trend (improving, stable, declining)
 */
function calculateGradeTrend(grades) {
  if (grades.length < 3) return 'insufficient_data';

  const recent = grades.slice(-3);
  const older = grades.slice(0, 3);

  const recentAvg =
    recent.reduce((sum, g) => sum + parseFloat(g.total), 0) / recent.length;
  const olderAvg =
    older.reduce((sum, g) => sum + parseFloat(g.total), 0) / older.length;

  const diff = recentAvg - olderAvg;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * Predict next semester GPA using weighted average
 */
function predictNextGpa(grades, currentGpa) {
  if (grades.length === 0) return currentGpa;

  // Weight recent grades more heavily
  const weights = grades.map((_, i) => i + 1);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);

  const weightedGpa =
    grades.reduce((sum, g, i) => {
      return sum + parseFloat(g.grade_points || 0) * weights[i];
    }, 0) / weightSum;

  // Blend with current GPA
  return Math.round(((weightedGpa * 0.7) + (currentGpa * 0.3)) * 100) / 100;
}

/**
 * Predict next month enrollment using simple trend
 */
function predictNextMonth(trends) {
  if (trends.length < 2) return null;

  const recent = trends.slice(-3);
  const avgTotal =
    recent.reduce((sum, t) => sum + t.total_enrollments, 0) / recent.length;

  // Simple trend: average of last 3 months
  return {
    next_month_estimate: Math.round(avgTotal),
    confidence: Math.min(recent.length * 20, 80),
    method: 'moving_average_3m',
  };
}

/**
 * Get recommendation based on risk level and trend
 */
function getRecommendation(riskLevel, trend) {
  if (riskLevel === 'high') {
    return 'Immediate academic support recommended. Consider tutoring or counseling.';
  }
  if (riskLevel === 'medium' && trend === 'declining') {
    return 'Monitor closely. Performance is declining and approaching risk threshold.';
  }
  if (trend === 'improving') {
    return 'Performance is improving. Continue current support strategies.';
  }
  return 'Performance is stable. Maintain current academic plan.';
}

export default {
  getEnrollmentTrends,
  predictStudentPerformance,
  getCourseDemandAnalysis,
  getProfessorWorkload,
  getAttendanceAnalytics,
};

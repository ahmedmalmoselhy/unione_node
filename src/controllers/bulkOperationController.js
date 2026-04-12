import { success } from '../utils/response.js';
import bulkOperationService from '../services/bulkOperationService.js';

/**
 * POST /api/v1/admin/bulk/enroll
 * Bulk enroll students in sections
 */
export async function enrollStudents(req, res, next) {
  try {
    const { student_ids: studentIds, section_ids: sectionIds, academic_term_id: academicTermId } =
      req.body;

    if (!studentIds?.length || !sectionIds?.length || !academicTermId) {
      return res.status(422).json({
        error: 'Missing required fields',
        required: ['student_ids', 'section_ids', 'academic_term_id'],
      });
    }

    const results = await bulkOperationService.bulkEnrollStudents({
      studentIds,
      sectionIds,
      academicTermId,
    });

    const statusCode = results.failed > 0 ? 207 : 201;
    return res.status(statusCode).json(
      success(
        results,
        `Bulk enrollment completed: ${results.success} successful, ${results.failed} failed, ${results.waitlisted} waitlisted`,
        statusCode
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/bulk/grades
 * Bulk update grades
 */
export async function updateGrades(req, res, next) {
  try {
    const { grades } = req.body;

    if (!grades?.length) {
      return res.status(422).json({
        error: 'Grades array is required',
      });
    }

    const results = await bulkOperationService.bulkUpdateGrades(grades);

    const statusCode = results.failed > 0 ? 207 : 200;
    return res.status(statusCode).json(
      success(
        results,
        `Bulk grade update completed: ${results.success} successful, ${results.failed} failed`,
        statusCode
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/bulk/transfer
 * Bulk transfer students
 */
export async function transferStudents(req, res, next) {
  try {
    const {
      student_ids: studentIds,
      new_department_id: newDepartmentId,
      note,
    } = req.body;

    if (!studentIds?.length || !newDepartmentId) {
      return res.status(422).json({
        error: 'Missing required fields',
        required: ['student_ids', 'new_department_id'],
      });
    }

    const results = await bulkOperationService.bulkTransferStudents({
      studentIds,
      newDepartmentId,
      note,
      transferredBy: req.user.id,
    });

    const statusCode = results.failed > 0 ? 207 : 200;
    return res.status(statusCode).json(
      success(
        results,
        `Bulk transfer completed: ${results.success} successful, ${results.failed} failed`,
        statusCode
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/v1/admin/bulk/enrollments
 * Bulk delete enrollments
 */
export async function deleteEnrollments(req, res, next) {
  try {
    const { enrollment_ids: enrollmentIds, reason } = req.body;

    if (!enrollmentIds?.length) {
      return res.status(422).json({
        error: 'Enrollment IDs are required',
      });
    }

    const results = await bulkOperationService.bulkDeleteEnrollments({
      enrollmentIds,
      reason,
    });

    const statusCode = results.failed > 0 ? 207 : 200;
    return res.status(statusCode).json(
      success(
        results,
        `Bulk delete completed: ${results.success} successful, ${results.failed} failed`,
        statusCode
      )
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/admin/bulk/exam-schedules
 * Bulk publish exam schedules
 */
export async function publishExamSchedules(req, res, next) {
  try {
    const { exam_schedules: examSchedules } = req.body;

    if (!examSchedules?.length) {
      return res.status(422).json({
        error: 'Exam schedules array is required',
      });
    }

    const results = await bulkOperationService.bulkPublishExamSchedules(examSchedules);

    const statusCode = results.failed > 0 ? 207 : 201;
    return res.status(statusCode).json(
      success(
        results,
        `Bulk exam schedule publish completed: ${results.success} successful, ${results.failed} failed`,
        statusCode
      )
    );
  } catch (error) {
    return next(error);
  }
}

export default {
  enrollStudents,
  updateGrades,
  transferStudents,
  deleteEnrollments,
  publishExamSchedules,
};

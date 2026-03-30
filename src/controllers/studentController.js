import { success, error as errorResponse } from '../utils/response.js';
import {
  getStudentProfile,
  getStudentEnrollments,
  getStudentGrades,
  enrollInSection,
  dropEnrollment,
} from '../services/studentService.js';

export async function profile(req, res, next) {
  try {
    const data = await getStudentProfile(req.user.id);

    if (!data) {
      return res.status(404).json(errorResponse('Student profile not found', 404));
    }

    return res.status(200).json(success(data, 'Student profile fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function enrollments(req, res, next) {
  try {
    const data = await getStudentEnrollments(req.user.id, req.query);
    return res.status(200).json(success(data, 'Student enrollments fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function grades(req, res, next) {
  try {
    const data = await getStudentGrades(req.user.id, req.query);
    return res.status(200).json(success(data, 'Student grades fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function enroll(req, res, next) {
  try {
    const result = await enrollInSection(req.user.id, req.body);

    if (!result.ok) {
      const map = {
        student_not_found: [404, 'Student profile not found'],
        student_not_active: [403, 'Student is not active for enrollment'],
        section_not_found: [404, 'Section not found or inactive'],
        already_enrolled: [409, 'Student is already enrolled in this section'],
        missing_prerequisites: [400, 'Missing course prerequisites'],
        section_full: [409, 'Section capacity is full'],
        already_exists_dropped: [409, 'Enrollment exists as dropped and cannot be recreated automatically'],
      };

      const [statusCode, message] = map[result.code] || [400, 'Unable to enroll student'];
      return res.status(statusCode).json(errorResponse(message, statusCode));
    }

    return res.status(201).json(success(result.data, 'Student enrolled successfully', 201));
  } catch (error) {
    return next(error);
  }
}

export async function drop(req, res, next) {
  try {
    const enrollmentId = Number(req.params.id);
    const result = await dropEnrollment(req.user.id, enrollmentId);

    if (!result.ok) {
      const map = {
        not_found: [404, 'Enrollment not found'],
        not_droppable: [400, 'Enrollment cannot be dropped in current status'],
      };

      const [statusCode, message] = map[result.code] || [400, 'Unable to drop enrollment'];
      return res.status(statusCode).json(errorResponse(message, statusCode));
    }

    return res.status(200).json(success(result.data, 'Enrollment dropped successfully', 200));
  } catch (error) {
    return next(error);
  }
}

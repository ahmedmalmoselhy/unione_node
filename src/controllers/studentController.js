import { success, error as errorResponse } from '../utils/response.js';
import {
  getStudentProfile,
  getStudentEnrollments,
  getStudentGrades,
  enrollInSection,
  dropEnrollment,
  getStudentWaitlist,
  removeStudentWaitlistEntry,
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
        section_full_waitlisted: [202, 'Section is full. Student added to waitlist'],
        already_waitlisted: [409, 'Student is already waitlisted for this section'],
        already_exists_dropped: [409, 'Enrollment exists as dropped and cannot be recreated automatically'],
      };

      const [statusCode, message] = map[result.code] || [400, 'Unable to enroll student'];
      if (result.code === 'section_full_waitlisted') {
        return res.status(statusCode).json(success(result.data, message, statusCode));
      }

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

export async function waitlist(req, res, next) {
  try {
    const data = await getStudentWaitlist(req.user.id);
    return res.status(200).json(success(data, 'Student waitlist fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function removeWaitlist(req, res, next) {
  try {
    const sectionId = Number(req.params.sectionId);
    const deleted = await removeStudentWaitlistEntry(req.user.id, sectionId);

    if (!deleted) {
      return res.status(404).json(errorResponse('Waitlist entry not found', 404));
    }

    return res.status(200).json(success({ removed: true }, 'Waitlist entry removed successfully', 200));
  } catch (error) {
    return next(error);
  }
}

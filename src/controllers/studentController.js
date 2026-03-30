import { success, error as errorResponse } from '../utils/response.js';
import {
  getStudentProfile,
  getStudentEnrollments,
  getStudentGrades,
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

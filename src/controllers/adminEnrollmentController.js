import { success, error as errorResponse } from '../utils/response.js';
import { listEnrollments, getEnrollmentById, createEnrollment, updateEnrollment, deleteEnrollment } from '../services/adminEnrollmentService.js';

export async function index(req, res, next) {
  try {
    const data = await listEnrollments(req.query, req.user);
    return res.status(200).json(success(data, 'Enrollments fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getEnrollmentById(id, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Enrollment not found', 404));
    }
    return res.status(200).json(success(data, 'Enrollment fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createEnrollment(req.body, req.user);
    return res.status(201).json(success(data, 'Enrollment created successfully', 201));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate enrollment unique value', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateEnrollment(id, req.body, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Enrollment not found', 404));
    }
    return res.status(200).json(success(data, 'Enrollment updated successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate enrollment unique value', 409));
    }
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteEnrollment(id, req.user);
    if (!deleted) {
      return res.status(404).json(errorResponse('Enrollment not found', 404));
    }
    return res.status(200).json(success({ deleted: true }, 'Enrollment deleted successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  index,
  show,
  store,
  update,
  destroy,
};
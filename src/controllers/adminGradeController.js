import { success, error as errorResponse } from '../utils/response.js';
import { listGrades, getGradeById, createGrade, updateGrade, deleteGrade } from '../services/adminGradeService.js';

export async function index(req, res, next) {
  try {
    const data = await listGrades(req.query);
    return res.status(200).json(success(data, 'Grades fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getGradeById(id);
    if (!data) {
      return res.status(404).json(errorResponse('Grade not found', 404));
    }
    return res.status(200).json(success(data, 'Grade fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createGrade(req.body, req.user.id);
    return res.status(201).json(success(data, 'Grade created successfully', 201));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Grade already exists for this enrollment', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateGrade(id, req.body, req.user.id);
    if (!data) {
      return res.status(404).json(errorResponse('Grade not found', 404));
    }
    return res.status(200).json(success(data, 'Grade updated successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteGrade(id);
    if (!deleted) {
      return res.status(404).json(errorResponse('Grade not found', 404));
    }
    return res.status(200).json(success({ deleted: true }, 'Grade deleted successfully', 200));
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
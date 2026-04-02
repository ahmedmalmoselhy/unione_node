import { success, error as errorResponse } from '../utils/response.js';
import {
  listProfessors,
  getProfessorDetailById,
  createProfessor,
  updateProfessor,
  deleteProfessor,
} from '../services/adminProfessorService.js';

export async function index(req, res, next) {
  try {
    const data = await listProfessors(req.query, req.user);
    return res.status(200).json(success(data, 'Professors fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getProfessorDetailById(id, req.user);

    if (!data) {
      return res.status(404).json(errorResponse('Professor not found', 404));
    }

    return res.status(200).json(success(data, 'Professor fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createProfessor(req.body, req.user);
    return res.status(201).json(success(data, 'Professor created successfully', 201));
  } catch (error) {
    if (error.status === 409 || error.code === '23505') {
      return res.status(409).json(errorResponse(error.message || 'Duplicate professor value', 409));
    }

    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }

    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateProfessor(id, req.body, req.user);

    if (!data) {
      return res.status(404).json(errorResponse('Professor not found', 404));
    }

    return res.status(200).json(success(data, 'Professor updated successfully', 200));
  } catch (error) {
    if (error.status === 409 || error.code === '23505') {
      return res.status(409).json(errorResponse(error.message || 'Duplicate professor value', 409));
    }

    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }

    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteProfessor(id, req.user);

    if (!deleted) {
      return res.status(404).json(errorResponse('Professor not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Professor deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Professor cannot be deleted because it is referenced by other records', 409));
    }

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
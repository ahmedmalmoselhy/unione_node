import { success, error as errorResponse } from '../utils/response.js';
import {
  listAcademicTerms,
  createAcademicTerm,
  updateAcademicTermById,
  deleteAcademicTermById,
} from '../services/adminAcademicTermService.js';

export async function index(req, res, next) {
  try {
    const data = await listAcademicTerms();
    return res.status(200).json(success(data, 'Academic terms fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createAcademicTerm(req.body);
    return res.status(201).json(success(data, 'Academic term created successfully', 201));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate academic term value', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateAcademicTermById(id, req.body);

    if (!data) {
      return res.status(404).json(errorResponse('Academic term not found', 404));
    }

    return res.status(200).json(success(data, 'Academic term updated successfully', 200));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate academic term value', 409));
    }
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteAcademicTermById(id);

    if (!deleted) {
      return res.status(404).json(errorResponse('Academic term not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Academic term deleted successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  index,
  store,
  update,
  destroy,
};
import { success, error as errorResponse } from '../utils/response.js';
import { listSections, getSectionById, createSection, updateSection, deleteSection } from '../services/adminSectionService.js';

export async function index(req, res, next) {
  try {
    const data = await listSections(req.query);
    return res.status(200).json(success(data, 'Sections fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getSectionById(id);
    if (!data) {
      return res.status(404).json(errorResponse('Section not found', 404));
    }
    return res.status(200).json(success(data, 'Section fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createSection(req.body);
    return res.status(201).json(success(data, 'Section created successfully', 201));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate section unique value', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateSection(id, req.body);
    if (!data) {
      return res.status(404).json(errorResponse('Section not found', 404));
    }
    return res.status(200).json(success(data, 'Section updated successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate section unique value', 409));
    }
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteSection(id);
    if (!deleted) {
      return res.status(404).json(errorResponse('Section not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Section deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Section cannot be deleted because it is referenced by other records', 409));
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
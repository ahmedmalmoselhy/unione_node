import { success, error as errorResponse } from '../utils/response.js';
import {
  listSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  listSectionTeachingAssistants,
  assignSectionTeachingAssistant,
  removeSectionTeachingAssistant,
} from '../services/adminSectionService.js';

export async function index(req, res, next) {
  try {
    const data = await listSections(req.query, req.user);
    return res.status(200).json(success(data, 'Sections fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getSectionById(id, req.user);
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
    const data = await createSection(req.body, req.user);
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
    const data = await updateSection(id, req.body, req.user);
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
    const deleted = await deleteSection(id, req.user);
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

export async function listTeachingAssistants(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const data = await listSectionTeachingAssistants(sectionId, req.user);
    return res.status(200).json(success(data, 'Section teaching assistants fetched successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function storeTeachingAssistant(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const { assignment, created } = await assignSectionTeachingAssistant(sectionId, req.body, req.user);
    const statusCode = created ? 201 : 200;
    const message = created ? 'Teaching assistant assigned successfully' : 'Teaching assistant already assigned';
    return res.status(statusCode).json(success(assignment, message, statusCode));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    return next(error);
  }
}

export async function destroyTeachingAssistant(req, res, next) {
  try {
    const sectionId = Number(req.params.id);
    const taId = Number(req.params.taId);
    const removed = await removeSectionTeachingAssistant(sectionId, taId, req.user);
    if (!removed) {
      return res.status(404).json(errorResponse('Teaching assistant assignment not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Teaching assistant removed successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
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
  listTeachingAssistants,
  storeTeachingAssistant,
  destroyTeachingAssistant,
};
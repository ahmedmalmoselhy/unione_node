import { success, error as errorResponse } from '../utils/response.js';
import { listCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../services/adminCourseService.js';

export async function index(req, res, next) {
  try {
    const data = await listCourses(req.query);
    return res.status(200).json(success(data, 'Courses fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getCourseById(id);
    if (!data) {
      return res.status(404).json(errorResponse('Course not found', 404));
    }

    return res.status(200).json(success(data, 'Course fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createCourse(req.body);
    return res.status(201).json(success(data, 'Course created successfully', 201));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.status === 400) {
      return res.status(400).json(errorResponse(error.message, 400));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate course code or unique value', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateCourse(id, req.body);
    if (!data) {
      return res.status(404).json(errorResponse('Course not found', 404));
    }

    return res.status(200).json(success(data, 'Course updated successfully', 200));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json(errorResponse(error.message, 404));
    }
    if (error.status === 400) {
      return res.status(400).json(errorResponse(error.message, 400));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate course code or unique value', 409));
    }
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteCourse(id);
    if (!deleted) {
      return res.status(404).json(errorResponse('Course not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Course deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Course cannot be deleted because it is referenced by other records', 409));
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
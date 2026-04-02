import { success, error as errorResponse } from '../utils/response.js';
import { listStudents, getStudentById, createStudent, updateStudent, transferStudent, deleteStudent } from '../services/adminStudentService.js';

export async function index(req, res, next) {
  try {
    const data = await listStudents(req.query);
    return res.status(200).json(success(data, 'Students fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getStudentById(id);
    if (!data) {
      return res.status(404).json(errorResponse('Student not found', 404));
    }
    return res.status(200).json(success(data, 'Student fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createStudent(req.body);
    return res.status(201).json(success(data, 'Student created successfully', 201));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate student unique value', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateStudent(id, req.body);
    if (!data) {
      return res.status(404).json(errorResponse('Student not found', 404));
    }
    return res.status(200).json(success(data, 'Student updated successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate student unique value', 409));
    }
    return next(error);
  }
}

export async function transfer(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await transferStudent(id, req.body.to_department_id, req.user.id, req.body.note);
    if (!data) {
      return res.status(404).json(errorResponse('Student not found', 404));
    }
    return res.status(200).json(success(data, 'Student transferred successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteStudent(id);
    if (!deleted) {
      return res.status(404).json(errorResponse('Student not found', 404));
    }
    return res.status(200).json(success({ deleted: true }, 'Student deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Student cannot be deleted because it is referenced by other records', 409));
    }
    return next(error);
  }
}

export default {
  index,
  show,
  store,
  update,
  transfer,
  destroy,
};
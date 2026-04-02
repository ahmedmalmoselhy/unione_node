import { success, error as errorResponse } from '../utils/response.js';
import { listEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } from '../services/adminEmployeeService.js';

export async function index(req, res, next) {
  try {
    const data = await listEmployees(req.query, req.user);
    return res.status(200).json(success(data, 'Employees fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await getEmployeeById(id, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Employee not found', 404));
    }
    return res.status(200).json(success(data, 'Employee fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function store(req, res, next) {
  try {
    const data = await createEmployee(req.body, req.user);
    return res.status(201).json(success(data, 'Employee created successfully', 201));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate employee unique value', 409));
    }
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await updateEmployee(id, req.body, req.user);
    if (!data) {
      return res.status(404).json(errorResponse('Employee not found', 404));
    }
    return res.status(200).json(success(data, 'Employee updated successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    if (error.code === '23505') {
      return res.status(409).json(errorResponse('Duplicate employee unique value', 409));
    }
    return next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteEmployee(id, req.user);
    if (!deleted) {
      return res.status(404).json(errorResponse('Employee not found', 404));
    }
    return res.status(200).json(success({ deleted: true }, 'Employee deleted successfully', 200));
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json(errorResponse('Employee cannot be deleted because it is referenced by other records', 409));
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
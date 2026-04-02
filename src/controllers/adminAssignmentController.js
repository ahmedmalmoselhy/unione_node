import { success, error as errorResponse } from '../utils/response.js';
import {
  assignFacultyAdmin,
  revokeFacultyAdmin,
  assignDepartmentAdmin,
  revokeDepartmentAdmin,
  assignDepartmentHead,
  revokeDepartmentHead,
} from '../services/adminAssignmentService.js';

export async function storeFacultyAdmin(req, res, next) {
  try {
    const facultyId = Number(req.params.id);
    const data = await assignFacultyAdmin(facultyId, req.body.user_id);
    return res.status(200).json(success(data, 'Faculty admin assigned successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    return next(error);
  }
}

export async function removeFacultyAdmin(req, res, next) {
  try {
    const facultyId = Number(req.params.id);
    const data = await revokeFacultyAdmin(facultyId);
    return res.status(200).json(success(data, 'Faculty admin revoked successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    return next(error);
  }
}

export async function storeDepartmentAdmin(req, res, next) {
  try {
    const departmentId = Number(req.params.id);
    const data = await assignDepartmentAdmin(departmentId, req.body.user_id);
    return res.status(200).json(success(data, 'Department admin assigned successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    return next(error);
  }
}

export async function removeDepartmentAdmin(req, res, next) {
  try {
    const departmentId = Number(req.params.id);
    const data = await revokeDepartmentAdmin(departmentId);
    return res.status(200).json(success(data, 'Department admin revoked successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    return next(error);
  }
}

export async function storeDepartmentHead(req, res, next) {
  try {
    const departmentId = Number(req.params.id);
    const data = await assignDepartmentHead(departmentId, req.body.user_id);
    return res.status(200).json(success(data, 'Department head assigned successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    return next(error);
  }
}

export async function removeDepartmentHead(req, res, next) {
  try {
    const departmentId = Number(req.params.id);
    const data = await revokeDepartmentHead(departmentId);
    return res.status(200).json(success(data, 'Department head revoked successfully', 200));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json(errorResponse(error.message, error.status));
    }
    return next(error);
  }
}

export default {
  storeFacultyAdmin,
  removeFacultyAdmin,
  storeDepartmentAdmin,
  removeDepartmentAdmin,
  storeDepartmentHead,
  removeDepartmentHead,
};
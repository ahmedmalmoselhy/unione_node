import { getPrimaryUniversity, updatePrimaryUniversity } from '../models/universityModel.js';
import { listFaculties, getFacultyById, createFaculty, updateFacultyById } from '../models/facultyModel.js';
import {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartmentById,
} from '../models/departmentModel.js';

function getRoleNames(user) {
  return Array.isArray(user?.roles) ? user.roles.map((role) => role.name) : [];
}

function hasRole(user, ...roles) {
  const names = getRoleNames(user);
  return roles.some((role) => names.includes(role));
}

function getFacultyRoleScopeIds(user) {
  if (!Array.isArray(user?.roles)) {
    return [];
  }

  return user.roles
    .map((role) => role.faculty_id)
    .filter((id) => id !== null && id !== undefined)
    .map((id) => Number(id));
}

function assertCanManageDepartment(user, facultyId) {
  if (hasRole(user, 'admin', 'university_admin')) {
    return;
  }

  if (hasRole(user, 'faculty_admin')) {
    const allowedFacultyIds = getFacultyRoleScopeIds(user);
    if (allowedFacultyIds.includes(Number(facultyId))) {
      return;
    }
  }

  const error = new Error('Forbidden: insufficient scope for this faculty');
  error.status = 403;
  throw error;
}

export async function getUniversity() {
  return getPrimaryUniversity();
}

export async function getFaculties({ activeOnly = false } = {}) {
  return listFaculties({ activeOnly });
}

export async function getDepartments({ activeOnly = false, facultyId } = {}) {
  return listDepartments({ activeOnly, facultyId });
}

export async function patchUniversity(user, payload) {
  if (!hasRole(user, 'admin', 'university_admin')) {
    const error = new Error('Forbidden: insufficient role permissions');
    error.status = 403;
    throw error;
  }

  return updatePrimaryUniversity(payload);
}

export async function addFaculty(user, payload) {
  if (!hasRole(user, 'admin', 'university_admin')) {
    const error = new Error('Forbidden: insufficient role permissions');
    error.status = 403;
    throw error;
  }

  return createFaculty(payload);
}

export async function patchFaculty(user, facultyId, payload) {
  if (!hasRole(user, 'admin', 'university_admin')) {
    const error = new Error('Forbidden: insufficient role permissions');
    error.status = 403;
    throw error;
  }

  const current = await getFacultyById(facultyId);
  if (!current) {
    return null;
  }

  return updateFacultyById(facultyId, payload);
}

export async function addDepartment(user, payload) {
  assertCanManageDepartment(user, payload.faculty_id);
  return createDepartment(payload);
}

export async function patchDepartment(user, departmentId, payload) {
  const current = await getDepartmentById(departmentId);
  if (!current) {
    return null;
  }

  const targetFacultyId = payload.faculty_id ?? current.faculty_id;
  assertCanManageDepartment(user, targetFacultyId);

  return updateDepartmentById(departmentId, payload);
}

export default {
  getUniversity,
  getFaculties,
  getDepartments,
  patchUniversity,
  addFaculty,
  patchFaculty,
  addDepartment,
  patchDepartment,
};

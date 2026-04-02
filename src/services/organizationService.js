import db from '../config/knex.js';
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

export async function getUniversityVicePresidents() {
  return db('university_vice_presidents as uvp')
    .join('users as u', 'u.id', 'uvp.user_id')
    .leftJoin('university as uni', 'uni.id', 'uvp.university_id')
    .select(
      'uvp.id',
      'uvp.user_id',
      'uvp.university_id',
      'uvp.department',
      'uvp.appointed_at',
      'u.first_name',
      'u.last_name',
      'u.email',
      'uni.name as university_name'
    )
    .orderBy('uvp.id', 'asc');
}

export async function addUniversityVicePresident(payload) {
  const university = await getPrimaryUniversity();
  if (!university) {
    return null;
  }

  const [created] = await db('university_vice_presidents')
    .insert({
      university_id: university.id,
      user_id: payload.user_id,
      department: payload.department,
      appointed_at: payload.appointed_at,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(['id']);

  return created;
}

export async function patchUniversityVicePresident(id, payload) {
  const [updated] = await db('university_vice_presidents')
    .where({ id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning(['id']);

  return updated;
}

export async function removeUniversityVicePresident(id) {
  return db('university_vice_presidents').where({ id }).del();
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

export async function removeFaculty(user, facultyId) {
  if (!hasRole(user, 'admin', 'university_admin')) {
    const error = new Error('Forbidden: insufficient role permissions');
    error.status = 403;
    throw error;
  }

  const current = await getFacultyById(facultyId);
  if (!current) {
    return false;
  }

  return db('faculties').where({ id: facultyId }).del();
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

export async function removeDepartment(user, departmentId) {
  const current = await getDepartmentById(departmentId);
  if (!current) {
    return false;
  }

  assertCanManageDepartment(user, current.faculty_id);
  return db('departments').where({ id: departmentId }).del();
}

export default {
  getUniversity,
  getFaculties,
  getDepartments,
  getUniversityVicePresidents,
  patchUniversity,
  addFaculty,
  patchFaculty,
  removeFaculty,
  addDepartment,
  patchDepartment,
  removeDepartment,
  addUniversityVicePresident,
  patchUniversityVicePresident,
  removeUniversityVicePresident,
};

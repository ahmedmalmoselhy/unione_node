import { getPrimaryUniversity } from '../models/universityModel.js';
import { listFaculties } from '../models/facultyModel.js';
import { listDepartments } from '../models/departmentModel.js';

export async function getUniversity() {
  return getPrimaryUniversity();
}

export async function getFaculties({ activeOnly = false } = {}) {
  return listFaculties({ activeOnly });
}

export async function getDepartments({ activeOnly = false, facultyId } = {}) {
  return listDepartments({ activeOnly, facultyId });
}

export default {
  getUniversity,
  getFaculties,
  getDepartments,
};

import db from '../config/knex.js';

const departmentColumns = [
  'id',
  'faculty_id',
  'name',
  'name_ar',
  'code',
  'type',
  'scope',
  'is_preparatory',
  'is_mandatory',
  'required_credit_hours',
  'head_id',
  'is_active',
  'logo_path',
  'created_at',
  'updated_at',
];

export async function listDepartments({ activeOnly = false, facultyId } = {}) {
  const query = db('departments').select(departmentColumns).orderBy('id', 'asc');

  if (activeOnly) {
    query.where({ is_active: true });
  }

  if (facultyId !== undefined && facultyId !== null) {
    query.where({ faculty_id: facultyId });
  }

  return query;
}

export default {
  listDepartments,
};

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

export async function getDepartmentById(id) {
  return db('departments').select(departmentColumns).where({ id }).first();
}

export async function createDepartment(payload) {
  const [created] = await db('departments')
    .insert({
      ...payload,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(departmentColumns);

  return created;
}

export async function updateDepartmentById(id, payload) {
  const [updated] = await db('departments')
    .where({ id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning(departmentColumns);

  return updated;
}

export default {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartmentById,
};

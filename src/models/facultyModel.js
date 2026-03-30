import db from '../config/knex.js';

const facultyColumns = [
  'id',
  'name',
  'name_ar',
  'code',
  'enrollment_type',
  'dean_id',
  'is_active',
  'logo_path',
  'created_at',
  'updated_at',
];

export async function listFaculties({ activeOnly = false } = {}) {
  const query = db('faculties').select(facultyColumns).orderBy('id', 'asc');

  if (activeOnly) {
    query.where({ is_active: true });
  }

  return query;
}

export async function getFacultyById(id) {
  return db('faculties').select(facultyColumns).where({ id }).first();
}

export async function createFaculty(payload) {
  const [created] = await db('faculties')
    .insert({
      ...payload,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(facultyColumns);

  return created;
}

export async function updateFacultyById(id, payload) {
  const [updated] = await db('faculties')
    .where({ id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning(facultyColumns);

  return updated;
}

export default {
  listFaculties,
  getFacultyById,
  createFaculty,
  updateFacultyById,
};

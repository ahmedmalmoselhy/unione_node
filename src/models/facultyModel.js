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

export default {
  listFaculties,
};

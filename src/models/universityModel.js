import db from '../config/knex.js';

const universityColumns = [
  'id',
  'name',
  'name_ar',
  'address',
  'logo_path',
  'established_at',
  'phone',
  'email',
  'website',
  'created_at',
  'updated_at',
];

export async function getPrimaryUniversity() {
  return db('university').select(universityColumns).orderBy('id', 'asc').first();
}

export async function updatePrimaryUniversity(payload) {
  const current = await getPrimaryUniversity();
  if (!current) {
    return null;
  }

  const [updated] = await db('university')
    .where({ id: current.id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning(universityColumns);

  return updated;
}

export default {
  getPrimaryUniversity,
  updatePrimaryUniversity,
};

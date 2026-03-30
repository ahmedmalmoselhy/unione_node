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

export default {
  getPrimaryUniversity,
};

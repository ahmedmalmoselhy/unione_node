import db from '../config/knex.js';

const academicTermColumns = [
  'id',
  'name',
  'academic_year',
  'semester',
  'starts_at',
  'ends_at',
  'registration_starts_at',
  'registration_ends_at',
  'withdrawal_deadline',
  'is_active',
  'created_at',
  'updated_at',
];

export async function listAcademicTerms() {
  return db('academic_terms').select(academicTermColumns).orderBy('academic_year', 'desc').orderBy('semester', 'asc');
}

export async function createAcademicTerm(payload) {
  const [created] = await db('academic_terms')
    .insert({
      ...payload,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(academicTermColumns);

  if (payload.is_active) {
    await db('academic_terms').whereNot({ id: created.id }).update({ is_active: false, updated_at: db.fn.now() });
  }

  return created;
}

export async function updateAcademicTermById(id, payload) {
  const [updated] = await db('academic_terms')
    .where({ id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning(academicTermColumns);

  if (payload.is_active) {
    await db('academic_terms').whereNot({ id }).update({ is_active: false, updated_at: db.fn.now() });
  }

  return updated;
}

export async function deleteAcademicTermById(id) {
  return db('academic_terms').where({ id }).del();
}

export default {
  listAcademicTerms,
  createAcademicTerm,
  updateAcademicTermById,
  deleteAcademicTermById,
};
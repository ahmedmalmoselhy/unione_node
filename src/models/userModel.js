import db from '../config/knex.js';

const userColumns = [
  'id',
  'national_id',
  'first_name',
  'last_name',
  'email',
  'password',
  'phone',
  'gender',
  'date_of_birth',
  'avatar_path',
  'is_active',
  'must_change_password',
  'created_at',
  'updated_at',
];

export function getUserColumns(includePassword = false) {
  if (includePassword) {
    return userColumns;
  }

  return userColumns.filter((column) => column !== 'password');
}

export async function findActiveByEmail(email, includePassword = false) {
  return db('users')
    .select(getUserColumns(includePassword))
    .whereRaw('LOWER(email) = LOWER(?)', [email])
    .whereNull('deleted_at')
    .first();
}

export async function findActiveById(id, includePassword = false) {
  return db('users')
    .select(getUserColumns(includePassword))
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

export async function updateUserPassword(userId, passwordHash, mustChangePassword = false) {
  return db('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .update({
      password: passwordHash,
      must_change_password: mustChangePassword,
      updated_at: db.fn.now(),
    });
}

export async function updateUserProfile(userId, profilePatch) {
  const payload = {
    ...profilePatch,
    updated_at: db.fn.now(),
  };

  const [updated] = await db('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .update(payload)
    .returning(getUserColumns(false));

  return updated;
}

export default {
  getUserColumns,
  findActiveByEmail,
  findActiveById,
  updateUserPassword,
  updateUserProfile,
};

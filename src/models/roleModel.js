import db from '../config/knex.js';

export async function listActiveRolesByUserId(userId) {
  return db('role_user as ru')
    .join('roles as r', 'r.id', 'ru.role_id')
    .select('r.id', 'r.name', 'r.label', 'ru.faculty_id', 'ru.department_id')
    .where('ru.user_id', userId)
    .whereNull('ru.revoked_at')
    .orderBy('r.id', 'asc');
}

export default {
  listActiveRolesByUserId,
};

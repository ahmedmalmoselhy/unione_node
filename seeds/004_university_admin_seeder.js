import { getRoleId, hashPassword, insertRoleAssignment, nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const roleId = await getRoleId(knex, 'university_admin');
  if (!roleId) return;

  const alreadyAssigned = await knex('role_user')
    .where({ role_id: roleId })
    .whereNull('revoked_at')
    .first('id');
  if (alreadyAssigned) return;

  const now = nowTs();
  const email = 'university.admin@unione.com';
  let user = await knex('users').where({ email }).first('id');

  if (!user) {
    [user] = await knex('users')
      .insert({
        national_id: '10000000000002',
        first_name: 'University',
        last_name: 'Admin',
        email,
        password: hashPassword('Admin@2025!'),
        gender: 'male',
        date_of_birth: '1980-01-01',
        is_active: true,
        must_change_password: false,
        email_verified_at: now,
        created_at: now,
        updated_at: now,
      })
      .returning('id');
  }

  await insertRoleAssignment(knex, {
    user_id: user.id,
    role_id: roleId,
    granted_at: now,
    revoked_at: null,
    faculty_id: null,
    department_id: null,
  });
}

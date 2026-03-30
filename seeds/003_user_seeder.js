import { getRoleId, hashPassword, insertRoleAssignment, nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const now = nowTs();
  const adminEmail = 'admin@unione.com';
  const existing = await knex('users').where({ email: adminEmail }).first('id');
  if (existing) return;

  const [user] = await knex('users')
    .insert({
      national_id: '10000000000001',
      first_name: 'Ahmed',
      last_name: 'AlMoselhy',
      email: adminEmail,
      password: hashPassword('241996'),
      gender: 'male',
      date_of_birth: '1990-01-01',
      is_active: true,
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })
    .returning('id');

  const roleId = await getRoleId(knex, 'admin');
  if (roleId) {
    await insertRoleAssignment(knex, {
      user_id: user.id,
      role_id: roleId,
      granted_at: now,
      revoked_at: null,
      faculty_id: null,
      department_id: null,
    });
  }
}

import { getRoleId, insertRoleAssignment, nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const now = nowTs();
  const deptAdminRoleId = await getRoleId(knex, 'department_admin');
  const departments = await knex('departments')
    .where({ scope: 'faculty' })
    .whereNotNull('faculty_id')
    .whereNotNull('head_id')
    .orderBy('id')
    .select('id', 'head_id');

  for (const dept of departments) {
    const existing = await knex('role_user')
      .where({ role_id: deptAdminRoleId, department_id: dept.id })
      .whereNull('revoked_at')
      .first('id');
    if (existing) continue;

    await insertRoleAssignment(knex, {
      user_id: dept.head_id,
      role_id: deptAdminRoleId,
      department_id: dept.id,
      faculty_id: null,
      granted_at: now,
      revoked_at: null,
    });
  }
}

import bcrypt from 'bcryptjs';

export function nowTs() {
  return new Date();
}

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function pick(pool, seed) {
  const idx = Math.abs(simpleHash(seed)) % pool.length;
  return pool[idx];
}

export function simpleHash(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export async function getRoleId(knex, roleName) {
  const row = await knex('roles').where({ name: roleName }).first('id');
  return row?.id ?? null;
}

export async function insertRoleAssignment(knex, payload) {
  const exists = await knex('role_user')
    .where({ user_id: payload.user_id, role_id: payload.role_id })
    .modify((q) => {
      if (payload.faculty_id !== undefined) {
        if (payload.faculty_id === null) q.whereNull('faculty_id');
        else q.andWhere('faculty_id', payload.faculty_id);
      }
      if (payload.department_id !== undefined) {
        if (payload.department_id === null) q.whereNull('department_id');
        else q.andWhere('department_id', payload.department_id);
      }
    })
    .first('id');

  if (!exists) {
    await knex('role_user').insert(payload);
  }
}

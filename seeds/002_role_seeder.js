import { nowTs } from './_seed_utils.js';

const roles = [
  { name: 'admin', label: 'Administrator' },
  { name: 'university_admin', label: 'University Administrator' },
  { name: 'student', label: 'Student' },
  { name: 'professor', label: 'Professor' },
  { name: 'employee', label: 'Employee' },
  { name: 'department_head', label: 'Department Head' },
  { name: 'dean', label: 'Dean' },
  { name: 'faculty_admin', label: 'Faculty Administrator' },
  { name: 'department_admin', label: 'Department Administrator' },
];

export async function seed(knex) {
  const now = nowTs();

  for (const role of roles) {
    const existing = await knex('roles').where({ name: role.name }).first('id');
    if (existing) {
      await knex('roles').where({ id: existing.id }).update({ ...role, updated_at: now });
    } else {
      await knex('roles').insert({ ...role, created_at: now, updated_at: now });
    }
  }
}

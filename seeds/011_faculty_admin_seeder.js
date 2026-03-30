import { getRoleId, hashPassword, insertRoleAssignment, nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const now = nowTs();
  const employeeRoleId = await getRoleId(knex, 'employee');
  const facultyAdminRoleId = await getRoleId(knex, 'faculty_admin');
  const faculties = await knex('faculties').select('id', 'code');

  for (const faculty of faculties) {
    const existing = await knex('role_user')
      .where({ role_id: facultyAdminRoleId, faculty_id: faculty.id })
      .whereNull('revoked_at')
      .first('id');
    if (existing) continue;

    const dept =
      (await knex('departments').where({ faculty_id: faculty.id, type: 'academic' }).orderBy('id').first('id')) ||
      (await knex('departments').where({ faculty_id: faculty.id }).orderBy('id').first('id'));

    if (!dept) continue;

    const email = `admin.${faculty.code.toLowerCase()}@unione.com`;
    let user = await knex('users').where({ email }).first('id');

    if (!user) {
      [user] = await knex('users')
        .insert({
          national_id: `9${String(faculty.id).padStart(13, '0')}`,
          first_name: faculty.code,
          last_name: 'Admin',
          email,
          password: hashPassword('Admin@2025!'),
          gender: 'male',
          date_of_birth: '1985-01-01',
          is_active: true,
          must_change_password: true,
          email_verified_at: now,
          created_at: now,
          updated_at: now,
        })
        .returning('id');
    }

    await insertRoleAssignment(knex, { user_id: user.id, role_id: employeeRoleId, granted_at: now, revoked_at: null, faculty_id: null, department_id: null });
    await insertRoleAssignment(knex, { user_id: user.id, role_id: facultyAdminRoleId, faculty_id: faculty.id, department_id: null, granted_at: now, revoked_at: null });

    await knex('employees')
      .insert({
        user_id: user.id,
        staff_number: `FA-${String(faculty.id).padStart(3, '0')}`,
        department_id: dept.id,
        job_title: 'Faculty Administrator',
        employment_type: 'full_time',
        salary: 15000.0,
        hired_at: now.toISOString().slice(0, 10),
        created_at: now,
        updated_at: now,
      })
      .onConflict('user_id')
      .ignore();
  }
}

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import bcrypt from 'bcryptjs';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Organization authorization integration', () => {
  let adminToken;
  let studentToken;
  let scopedFacultyId;
  let scopedFacultyAdminEmail;
  let scopedFacultyAdminUserId;
  let anotherFacultyId;
  let targetUserId;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@unione.com', password: '241996' })
      .expect(200);

    adminToken = adminLogin.body.data.token;

    const student = await db('users as u')
      .join('role_user as ru', 'ru.user_id', 'u.id')
      .join('roles as r', 'r.id', 'ru.role_id')
      .where('r.name', 'student')
      .select('u.id', 'u.email')
      .first();

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: '241996' })
      .expect(200);

    studentToken = studentLogin.body.data.token;
    targetUserId = student.id;

    const faculty = await db('faculties').select('id').orderBy('id', 'asc').first();
    scopedFacultyId = faculty.id;

    const createdFaculty = await request(app)
      .post('/api/organization/faculties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Scope Test Faculty ${Date.now()}`,
        name_ar: `Scope Test Faculty ${Date.now()}`,
        code: `SCF-${Date.now()}`,
        enrollment_type: 'immediate',
      })
      .expect(201);

    anotherFacultyId = createdFaculty.body.data.id;

    const role = await db('roles').where({ name: 'faculty_admin' }).first('id');

    scopedFacultyAdminEmail = `itest.facadmin.${Date.now()}@unione.com`;
    const [createdUser] = await db('users')
      .insert({
        national_id: String(Date.now()).slice(0, 14).padEnd(14, '0'),
        first_name: 'ITest',
        last_name: 'FacultyAdmin',
        email: scopedFacultyAdminEmail,
        password: await bcrypt.hash('241996', 10),
        gender: 'male',
        is_active: true,
        email_verified_at: db.fn.now(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    scopedFacultyAdminUserId = createdUser.id;

    await db('role_user').insert({
      user_id: scopedFacultyAdminUserId,
      role_id: role.id,
      faculty_id: scopedFacultyId,
      department_id: null,
      granted_at: db.fn.now(),
      revoked_at: null,
    });
  });

  afterAll(async () => {
    if (anotherFacultyId) {
      await db('faculties').where({ id: anotherFacultyId }).del();
    }

    if (scopedFacultyAdminUserId) {
      await db('role_user').where({ user_id: scopedFacultyAdminUserId }).del();
      await db('users').where({ id: scopedFacultyAdminUserId }).del();
    }

    await db.destroy();
  });

  test('unauthenticated request is rejected', async () => {
    await request(app)
      .get('/api/organization/university')
      .expect(401);
  });

  test('student role is forbidden from organization module', async () => {
    await request(app)
      .get('/api/organization/university')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  test('admin role can read organization module', async () => {
    const response = await request(app)
      .get('/api/organization/university')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.status).toBe('success');
  });

  test('faculty_admin is blocked from creating faculty but can create department in scoped faculty', async () => {
    const facultyAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: scopedFacultyAdminEmail, password: '241996' })
      .expect(200);

    const facultyAdminToken = facultyAdminLogin.body.data.token;

    await request(app)
      .post('/api/organization/faculties')
      .set('Authorization', `Bearer ${facultyAdminToken}`)
      .send({
        name: 'Forbidden Faculty',
        name_ar: 'Forbidden Faculty',
        code: `FF-${Date.now()}`,
        enrollment_type: 'immediate',
      })
      .expect(403);

    const deptCode = `SCP-${Date.now()}`;
    const createDept = await request(app)
      .post('/api/organization/departments')
      .set('Authorization', `Bearer ${facultyAdminToken}`)
      .send({
        faculty_id: scopedFacultyId,
        name: 'Scoped Department',
        name_ar: 'Scoped Department',
        code: deptCode,
        type: 'academic',
        scope: 'faculty',
      })
      .expect(201);

    expect(createDept.body.status).toBe('success');

    const differentFaculty = await db('faculties')
      .whereNot('id', scopedFacultyId)
      .select('id')
      .first();

    if (differentFaculty) {
      await request(app)
        .post('/api/organization/departments')
        .set('Authorization', `Bearer ${facultyAdminToken}`)
        .send({
          faculty_id: differentFaculty.id,
          name: 'Out Of Scope Department',
          name_ar: 'Out Of Scope Department',
          code: `OOS-${Date.now()}`,
          type: 'academic',
          scope: 'faculty',
        })
        .expect(403);
    }
  });

  test('faculty_admin cannot assign admin role outside scoped faculty', async () => {
    const facultyAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: scopedFacultyAdminEmail, password: '241996' })
      .expect(200);

    const facultyAdminToken = facultyAdminLogin.body.data.token;

    await request(app)
      .post(`/api/admin/faculties/${anotherFacultyId}/assign-admin`)
      .set('Authorization', `Bearer ${facultyAdminToken}`)
      .send({ user_id: targetUserId })
      .expect(403);
  });
});

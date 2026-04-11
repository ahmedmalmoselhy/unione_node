import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Admin section group projects integration', () => {
  let adminToken;
  let sectionId;
  let enrolledStudentId;
  let outsiderStudentId;
  let outsiderUserId;
  let canRun = true;

  beforeAll(async () => {
    const [hasSections, hasEnrollments, hasStudents, hasUsers, hasRoles, hasRoleUser] = await Promise.all([
      db.schema.hasTable('sections'),
      db.schema.hasTable('enrollments'),
      db.schema.hasTable('students'),
      db.schema.hasTable('users'),
      db.schema.hasTable('roles'),
      db.schema.hasTable('role_user'),
    ]);

    if (!hasSections || !hasEnrollments || !hasStudents || !hasUsers || !hasRoles || !hasRoleUser) {
      canRun = false;
      return;
    }

    const hasGroupProjects = await db.schema.hasTable('group_projects');
    if (!hasGroupProjects) {
      await db.schema.createTable('group_projects', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('section_id').unsigned().notNullable();
        table.string('title', 255).notNullable();
        table.text('description').nullable();
        table.timestamp('due_at').nullable();
        table.integer('max_members').notNullable().defaultTo(5);
        table.boolean('is_active').notNullable().defaultTo(true);
        table.bigInteger('created_by_user_id').unsigned().nullable();
        table.timestamps(true, true);

        table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
        table.foreign('created_by_user_id').references('id').inTable('users').onDelete('SET NULL');
      });
    }

    const hasGroupProjectMembers = await db.schema.hasTable('group_project_members');
    if (!hasGroupProjectMembers) {
      await db.schema.createTable('group_project_members', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('group_project_id').unsigned().notNullable();
        table.bigInteger('student_id').unsigned().notNullable();
        table.timestamp('joined_at').notNullable().defaultTo(db.fn.now());
        table.timestamps(true, true);

        table.unique(['group_project_id', 'student_id']);
        table.foreign('group_project_id').references('id').inTable('group_projects').onDelete('CASCADE');
        table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
      });
    }

    const admin = await db('users as u')
      .join('role_user as ru', 'ru.user_id', 'u.id')
      .join('roles as r', 'r.id', 'ru.role_id')
      .whereIn('r.name', ['admin', 'university_admin'])
      .select('u.email')
      .first();

    const sectionEnrollment = await db('sections as s')
      .join('enrollments as e', 'e.section_id', 's.id')
      .whereIn('e.status', ['registered', 'completed'])
      .select('s.id as section_id', 'e.student_id')
      .orderBy('s.id', 'asc')
      .first();

    if (!admin || !sectionEnrollment) {
      canRun = false;
      return;
    }

    sectionId = sectionEnrollment.section_id;
    enrolledStudentId = sectionEnrollment.student_id;

    const outsider = await db('students as st')
      .whereNot('st.id', enrolledStudentId)
      .whereNotExists(function notEnrolledInSection() {
        this.select(db.raw('1'))
          .from('enrollments as e')
          .whereRaw('e.student_id = st.id')
          .andWhere('e.section_id', sectionId)
          .whereIn('e.status', ['registered', 'completed']);
      })
      .select('st.id')
      .first();

    if (outsider) {
      outsiderStudentId = outsider.id;
    } else {
      const baseStudent = await db('students').where({ id: enrolledStudentId }).first();
      if (!baseStudent) {
        canRun = false;
        return;
      }

      const suffix = `${Date.now()}`;
      const [createdUser] = await db('users')
        .insert({
          national_id: `NAT-GP-${suffix}`,
          first_name: 'Outsider',
          last_name: 'Student',
          email: `outsider.gp.${suffix}@example.com`,
          password: 'not-used',
          gender: 'male',
          is_active: true,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning('id');

      outsiderUserId = createdUser.id ?? createdUser;

      const [createdStudent] = await db('students')
        .insert({
          user_id: outsiderUserId,
          student_number: `GP-OUT-${suffix}`,
          faculty_id: baseStudent.faculty_id,
          department_id: baseStudent.department_id,
          academic_year: baseStudent.academic_year || 1,
          semester: 'first',
          enrollment_status: 'active',
          enrolled_at: new Date().toISOString().slice(0, 10),
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning('id');

      outsiderStudentId = createdStudent.id ?? createdStudent;
    }

    await db('group_project_members')
      .whereIn(
        'group_project_id',
        db('group_projects').where('section_id', sectionId).select('id')
      )
      .del();
    await db('group_projects').where('section_id', sectionId).where('title', 'like', 'INTEG GP %').del();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: '241996' })
      .expect(200);

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    if (sectionId) {
      await db('group_project_members')
        .whereIn(
          'group_project_id',
          db('group_projects').where('section_id', sectionId).select('id')
        )
        .del();
      await db('group_projects').where('section_id', sectionId).where('title', 'like', 'INTEG GP %').del();
    }

    if (outsiderStudentId && outsiderUserId) {
      await db('students').where({ id: outsiderStudentId }).del();
      await db('users').where({ id: outsiderUserId }).del();
    }

    await db.destroy();
  });

  test('group project endpoints provide create/update/member/delete lifecycle', async () => {
    if (!canRun) {
      return;
    }

    const listBefore = await request(app)
      .get(`/api/admin/sections/${sectionId}/group-projects`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listBefore.body.data)).toBe(true);

    await request(app)
      .post(`/api/admin/sections/${sectionId}/group-projects`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'missing title' })
      .expect(400);

    const createRes = await request(app)
      .post(`/api/admin/sections/${sectionId}/group-projects`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `INTEG GP ${Date.now()}`,
        description: 'Integration test project',
        max_members: 2,
      })
      .expect(201);

    const projectId = createRes.body.data.id;

    await request(app)
      .post(`/api/admin/sections/${sectionId}/group-projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);

    await request(app)
      .post(`/api/admin/sections/${sectionId}/group-projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: outsiderStudentId })
      .expect(400);

    const addMemberRes = await request(app)
      .post(`/api/admin/sections/${sectionId}/group-projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: enrolledStudentId })
      .expect(201);

    const memberId = addMemberRes.body.data.id;

    await request(app)
      .post(`/api/admin/sections/${sectionId}/group-projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ student_id: enrolledStudentId })
      .expect(200);

    const patchRes = await request(app)
      .patch(`/api/admin/sections/${sectionId}/group-projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'INTEG GP Updated', is_active: false })
      .expect(200);

    expect(patchRes.body.data.title).toBe('INTEG GP Updated');
    expect(patchRes.body.data.is_active).toBe(false);

    const listRes = await request(app)
      .get(`/api/admin/sections/${sectionId}/group-projects`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const project = listRes.body.data.find((item) => Number(item.id) === Number(projectId));
    expect(project).toBeDefined();
    expect(Array.isArray(project.members)).toBe(true);
    expect(project.members.some((member) => Number(member.id) === Number(memberId))).toBe(true);

    await request(app)
      .delete(`/api/admin/sections/${sectionId}/group-projects/${projectId}/members/9999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    await request(app)
      .delete(`/api/admin/sections/${sectionId}/group-projects/${projectId}/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app)
      .delete(`/api/admin/sections/${sectionId}/group-projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app)
      .delete(`/api/admin/sections/${sectionId}/group-projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});

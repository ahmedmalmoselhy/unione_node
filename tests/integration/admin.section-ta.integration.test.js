import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Admin section teaching assistant integration', () => {
  let adminToken;
  let sectionId;
  let professorId;
  let canRun = true;

  beforeAll(async () => {
    const [hasSections, hasProfessors, hasUsers, hasRoles, hasRoleUser] = await Promise.all([
      db.schema.hasTable('sections'),
      db.schema.hasTable('professors'),
      db.schema.hasTable('users'),
      db.schema.hasTable('roles'),
      db.schema.hasTable('role_user'),
    ]);

    if (!hasSections || !hasProfessors || !hasUsers || !hasRoles || !hasRoleUser) {
      canRun = false;
      return;
    }

    const hasAssignmentsTable = await db.schema.hasTable('section_teaching_assistants');
    if (!hasAssignmentsTable) {
      await db.schema.createTable('section_teaching_assistants', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('section_id').unsigned().notNullable();
        table.bigInteger('professor_id').unsigned().notNullable();
        table.bigInteger('assigned_by_user_id').unsigned().nullable();
        table.timestamps(true, true);

        table.unique(['section_id', 'professor_id']);
        table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
        table.foreign('professor_id').references('id').inTable('professors').onDelete('CASCADE');
        table.foreign('assigned_by_user_id').references('id').inTable('users').onDelete('SET NULL');
      });
    }

    const admin = await db('users as u')
      .join('role_user as ru', 'ru.user_id', 'u.id')
      .join('roles as r', 'r.id', 'ru.role_id')
      .whereIn('r.name', ['admin', 'university_admin'])
      .select('u.email')
      .first();

    const section = await db('sections').select('id', 'professor_id').orderBy('id', 'asc').first();

    if (!admin || !section) {
      canRun = false;
      return;
    }

    sectionId = section.id;

    const alternateProfessor = await db('professors')
      .whereNot('id', section.professor_id)
      .select('id')
      .orderBy('id', 'asc')
      .first();

    professorId = alternateProfessor?.id || section.professor_id;

    await db('section_teaching_assistants')
      .where({ section_id: sectionId, professor_id: professorId })
      .del();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: '241996' })
      .expect(200);

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    if (sectionId && professorId) {
      await db('section_teaching_assistants')
        .where({ section_id: sectionId, professor_id: professorId })
        .del();
    }
    await db.destroy();
  });

  test('teaching assistant endpoints provide create/list/delete lifecycle', async () => {
    if (!canRun) {
      return;
    }

    await request(app)
      .post(`/api/admin/sections/${sectionId}/teaching-assistants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);

    await request(app)
      .post(`/api/admin/sections/${sectionId}/teaching-assistants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ professor_id: 99999999 })
      .expect(404);

    const createRes = await request(app)
      .post(`/api/admin/sections/${sectionId}/teaching-assistants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ professor_id: professorId })
      .expect(201);

    const assignmentId = createRes.body.data.id;
    expect(createRes.body.data.section_id).toBe(sectionId);

    await request(app)
      .post(`/api/admin/sections/${sectionId}/teaching-assistants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ professor_id: professorId })
      .expect(200);

    const listRes = await request(app)
      .get(`/api/admin/sections/${sectionId}/teaching-assistants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some((row) => Number(row.id) === Number(assignmentId))).toBe(true);

    await request(app)
      .delete(`/api/admin/sections/${sectionId}/teaching-assistants/99999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    await request(app)
      .delete(`/api/admin/sections/${sectionId}/teaching-assistants/${assignmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Admin section exam schedule integration', () => {
  let adminToken;
  let sectionId;
  let canRun = true;

  beforeAll(async () => {
    const [hasSections, hasUsers, hasRoles, hasRoleUser] = await Promise.all([
      db.schema.hasTable('sections'),
      db.schema.hasTable('users'),
      db.schema.hasTable('roles'),
      db.schema.hasTable('role_user'),
    ]);

    if (!hasSections || !hasUsers || !hasRoles || !hasRoleUser) {
      canRun = false;
      return;
    }

    const hasExamSchedulesTable = await db.schema.hasTable('exam_schedules');
    if (!hasExamSchedulesTable) {
      await db.schema.createTable('exam_schedules', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('section_id').unsigned().notNullable().unique();
        table.date('exam_date').notNullable();
        table.time('start_time').notNullable();
        table.time('end_time').notNullable();
        table.string('location', 255).nullable();
        table.boolean('is_published').notNullable().defaultTo(false);
        table.timestamp('published_at').nullable();
        table.timestamps(true, true);

        table.foreign('section_id').references('id').inTable('sections').onDelete('CASCADE');
      });
    }

    const admin = await db('users as u')
      .join('role_user as ru', 'ru.user_id', 'u.id')
      .join('roles as r', 'r.id', 'ru.role_id')
      .whereIn('r.name', ['admin', 'university_admin'])
      .select('u.email')
      .first();

    const section = await db('sections').select('id').orderBy('id', 'asc').first();

    if (!admin || !section) {
      canRun = false;
      return;
    }

    sectionId = section.id;

    await db('exam_schedules').where({ section_id: sectionId }).del();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: '241996' })
      .expect(200);

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    if (sectionId) {
      await db('exam_schedules').where({ section_id: sectionId }).del();
    }
    await db.destroy();
  });

  test('exam schedule endpoints provide create/read/update/publish lifecycle', async () => {
    if (!canRun) {
      return;
    }

    await request(app)
      .get(`/api/admin/sections/${sectionId}/exam-schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    await request(app)
      .post(`/api/admin/sections/${sectionId}/exam-schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ exam_date: '2027-01-15' })
      .expect(400);

    const createRes = await request(app)
      .post(`/api/admin/sections/${sectionId}/exam-schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        exam_date: '2027-01-15',
        start_time: '09:00',
        end_time: '11:00',
        location: 'Main Hall',
      })
      .expect(201);

    const examScheduleId = createRes.body.data.id;
    expect(createRes.body.data.section_id).toBe(sectionId);

    await request(app)
      .post(`/api/admin/sections/${sectionId}/exam-schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        exam_date: '2027-01-16',
        start_time: '10:00',
        end_time: '12:00',
      })
      .expect(409);

    const getRes = await request(app)
      .get(`/api/admin/sections/${sectionId}/exam-schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Number(getRes.body.data.id)).toBe(Number(examScheduleId));

    const publishRes = await request(app)
      .post(`/api/admin/sections/${sectionId}/exam-schedule/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(publishRes.body.data.is_published).toBe(true);

    const patchRes = await request(app)
      .patch(`/api/admin/sections/${sectionId}/exam-schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ location: 'Hall B' })
      .expect(200);

    expect(patchRes.body.data.location).toBe('Hall B');
    expect(patchRes.body.data.is_published).toBe(false);
  });
});

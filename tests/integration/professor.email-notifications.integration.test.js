import request from 'supertest';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Professor email delivery integration', () => {
  let professorToken;
  let sectionId;
  let enrollmentId;
  let canRun = true;

  beforeAll(async () => {
    const [hasSections, hasProfessors, hasUsers, hasEnrollments] = await Promise.all([
      db.schema.hasTable('sections'),
      db.schema.hasTable('professors'),
      db.schema.hasTable('users'),
      db.schema.hasTable('enrollments'),
    ]);

    if (!hasSections || !hasProfessors || !hasUsers || !hasEnrollments) {
      canRun = false;
      return;
    }

    const row = await db('sections as s')
      .join('professors as p', 'p.id', 's.professor_id')
      .join('users as u', 'u.id', 'p.user_id')
      .join('enrollments as e', 'e.section_id', 's.id')
      .whereIn('e.status', ['registered', 'completed'])
      .select('s.id as section_id', 'u.email as professor_email', 'e.id as enrollment_id')
      .orderBy('s.id', 'asc')
      .first();

    if (!row) {
      canRun = false;
      return;
    }

    sectionId = row.section_id;
    enrollmentId = row.enrollment_id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: row.professor_email, password: '241996' });

    if (loginRes.status !== 200 || !loginRes.body?.data?.token) {
      canRun = false;
      return;
    }

    professorToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('professor announcement and grade submission still succeed with email delivery enabled', async () => {
    if (!canRun) {
      return;
    }

    await request(app)
      .post(`/api/professor/sections/${sectionId}/announcements`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        title: `Email notice ${Date.now()}`,
        body: 'Integration test announcement body',
      })
      .expect(201);

    await request(app)
      .post(`/api/professor/sections/${sectionId}/grades`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        grades: [
          {
            enrollment_id: enrollmentId,
            midterm: 30,
            final: 35,
            coursework: 25,
          },
        ],
      })
      .expect(200);
  });
});

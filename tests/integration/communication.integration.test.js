import crypto from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Announcements and notifications integration', () => {
  let adminToken;
  let studentToken;
  let studentUserId;
  let canRun = true;
  let canRunWebhooks = true;

  beforeAll(async () => {
    const [hasAnnouncements, hasAnnouncementReads, hasNotifications, hasWebhooks, hasWebhookDeliveries] = await Promise.all([
      db.schema.hasTable('announcements'),
      db.schema.hasTable('announcement_reads'),
      db.schema.hasTable('notifications'),
      db.schema.hasTable('webhooks'),
      db.schema.hasTable('webhook_deliveries'),
    ]);

    if (!hasAnnouncements || !hasAnnouncementReads || !hasNotifications) {
      canRun = false;
      return;
    }

    if (!hasWebhooks || !hasWebhookDeliveries) {
      canRunWebhooks = false;
    }

    const admin = await db('users as u')
      .join('role_user as ru', 'ru.user_id', 'u.id')
      .join('roles as r', 'r.id', 'ru.role_id')
      .whereIn('r.name', ['admin', 'super_admin'])
      .select('u.email')
      .first();

    const student = await db('users as u')
      .join('students as s', 's.user_id', 'u.id')
      .select('u.email', 'u.id')
      .first();

    studentUserId = student.id;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: '241996' })
      .expect(200);

    adminToken = adminLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: '241996' })
      .expect(200);

    studentToken = studentLogin.body.data.token;
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('announcement lifecycle works with role restrictions', async () => {
    if (!canRun) {
      return;
    }

    const createRes = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Integration Announcement ${Date.now()}`,
        body: 'Integration test announcement body',
        type: 'general',
        visibility: 'university',
      })
      .expect(201);

    const announcementId = createRes.body.data.id;

    const studentList = await request(app)
      .get('/api/announcements')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(studentList.body.data.items)).toBe(true);
    expect(studentList.body.data.items.some((item) => item.id === announcementId)).toBe(true);

    await request(app)
      .post(`/api/announcements/${announcementId}/read`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .patch(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Integration Announcement' })
      .expect(200);

    await request(app)
      .delete(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  test('notification list/read-all/read/delete endpoints work', async () => {
    if (!canRun) {
      return;
    }

    const notificationOne = {
      id: crypto.randomUUID(),
      type: 'integration.notification',
      notifiable_type: 'App\\Models\\User',
      notifiable_id: studentUserId,
      data: JSON.stringify({ message: 'Notification one' }),
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    };

    const notificationTwo = {
      id: crypto.randomUUID(),
      type: 'integration.notification',
      notifiable_type: 'App\\Models\\User',
      notifiable_id: studentUserId,
      data: JSON.stringify({ message: 'Notification two' }),
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    };

    await db('notifications').insert([notificationOne, notificationTwo]);

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.data.items)).toBe(true);
    expect(listRes.body.data.items.some((item) => item.id === notificationOne.id)).toBe(true);

    await request(app)
      .post(`/api/notifications/${notificationOne.id}/read`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .post('/api/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .delete(`/api/notifications/${notificationTwo.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
  });

  test('webhook management endpoints allow user-scoped CRUD', async () => {
    if (!canRun || !canRunWebhooks) {
      return;
    }

    const createRes = await request(app)
      .post('/api/webhooks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        url: 'https://example.com/unione-webhook',
        events: ['enrollment.created', 'grades.submitted'],
      })
      .expect(201);

    const webhookId = createRes.body.data.id;
    expect(createRes.body.data.secret).toBeTruthy();

    const listRes = await request(app)
      .get('/api/webhooks')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.data.items)).toBe(true);
    expect(listRes.body.data.items.some((item) => item.id === webhookId)).toBe(true);

    await request(app)
      .patch(`/api/webhooks/${webhookId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ is_active: false })
      .expect(200);

    await request(app)
      .delete(`/api/webhooks/${webhookId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
  });
});

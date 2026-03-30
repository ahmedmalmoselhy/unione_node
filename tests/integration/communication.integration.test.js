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

  test('notification preferences endpoints read and update per event type', async () => {
    const hasPreferencesTable = await db.schema.hasTable('notification_preferences');

    if (!hasPreferencesTable) {
      await db.schema.createTable('notification_preferences', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('user_id').unsigned().notNullable();
        table.string('event_type', 100).notNullable();
        table.boolean('is_enabled').notNullable().defaultTo(true);
        table.timestamps(true, true);

        table.unique(['user_id', 'event_type']);
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }

    const listRes = await request(app)
      .get('/api/notifications/preferences')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.data.items)).toBe(true);
    expect(listRes.body.data.items.length).toBeGreaterThan(0);

    const updateRes = await request(app)
      .put('/api/notifications/preferences')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        preferences: [
          { event_type: 'announcement.new', is_enabled: false },
          { event_type: 'grades.submitted', is_enabled: true },
        ],
      })
      .expect(200);

    const updatedAnnouncement = updateRes.body.data.items.find((item) => item.event_type === 'announcement.new');
    expect(updatedAnnouncement).toBeTruthy();
    expect(updatedAnnouncement.is_enabled).toBe(false);
  });

  test('notification quiet-hours endpoints read and update user settings', async () => {
    const hasQuietHoursTable = await db.schema.hasTable('notification_quiet_hours');

    if (!hasQuietHoursTable) {
      await db.schema.createTable('notification_quiet_hours', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('user_id').unsigned().notNullable().unique();
        table.string('start_time', 5).notNullable();
        table.string('end_time', 5).notNullable();
        table.string('timezone', 64).notNullable().defaultTo('UTC');
        table.boolean('is_enabled').notNullable().defaultTo(false);
        table.timestamps(true, true);

        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
    }

    const getRes = await request(app)
      .get('/api/notifications/quiet-hours')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(getRes.body.data.quiet_hours).toBeTruthy();

    const updateRes = await request(app)
      .put('/api/notifications/quiet-hours')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        quiet_hours: {
          start_time: '23:00',
          end_time: '06:30',
          timezone: 'Africa/Cairo',
          is_enabled: true,
        },
      })
      .expect(200);

    expect(updateRes.body.data.quiet_hours.start_time).toBe('23:00');
    expect(updateRes.body.data.quiet_hours.end_time).toBe('06:30');
    expect(updateRes.body.data.quiet_hours.timezone).toBe('Africa/Cairo');
    expect(updateRes.body.data.quiet_hours.is_enabled).toBe(true);
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

  test('webhook dead-letter endpoints list and retry failed deliveries', async () => {
    if (!canRun || !canRunWebhooks) {
      return;
    }

    const [webhook] = await db('webhooks')
      .insert({
        user_id: studentUserId,
        url: 'http://127.0.0.1:1/dead-letter-webhook-test',
        secret: 'dead-letter-secret-test',
        events: JSON.stringify(['enrollment.created']),
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const [failedDelivery] = await db('webhook_deliveries')
      .insert({
        webhook_id: webhook.id,
        event: 'enrollment.created',
        payload: JSON.stringify({ enrollment_id: 123 }),
        response_status: 500,
        response_body: 'Initial failure',
        attempt: 3,
        delivered_at: db.fn.now(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const listRes = await request(app)
      .get('/api/webhooks/dead-letter?limit=25')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.data.items)).toBe(true);
    expect(listRes.body.data.items.some((item) => Number(item.id) === Number(failedDelivery.id))).toBe(true);

    const retryRes = await request(app)
      .post(`/api/webhooks/dead-letter/${failedDelivery.id}/retry`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(retryRes.body.data.retried).toBe(true);
    expect(typeof retryRes.body.data.success).toBe('boolean');
  });

  test('admin analytics endpoints return ratings and attendance summaries', async () => {
    const ratingsRes = await request(app)
      .get('/api/admin/analytics/ratings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(ratingsRes.body.data)).toBe(true);

    const attendanceRes = await request(app)
      .get('/api/admin/analytics/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(attendanceRes.body.data)).toBe(true);
  });

  test('admin failed webhook deliveries endpoint returns failed delivery list', async () => {
    if (!canRun || !canRunWebhooks) {
      return;
    }

    const res = await request(app)
      .get('/api/admin/webhooks/failed?limit=25')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

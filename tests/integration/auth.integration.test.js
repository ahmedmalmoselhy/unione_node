import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Auth integration', () => {
  let adminEmail;
  const adminPassword = '241996';

  beforeAll(async () => {
    const row = await db('users').where({ email: 'admin@unione.com' }).first('email');
    adminEmail = row?.email || 'admin@unione.com';
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('login + me works', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    expect(loginRes.body.status).toBe('success');
    expect(loginRes.body.data.token).toBeTruthy();

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`)
      .expect(200);

    expect(meRes.body.data.email.toLowerCase()).toBe(adminEmail.toLowerCase());
  });

  test('forgot/reset password flow works and keeps login valid', async () => {
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: adminEmail })
      .expect(200);

    expect(forgotRes.body.status).toBe('success');
    expect(forgotRes.body.data.reset_token).toBeTruthy();

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: adminEmail,
        token: forgotRes.body.data.reset_token,
        password: adminPassword,
        password_confirmation: adminPassword,
      })
      .expect(200);

    expect(resetRes.body.data.reset).toBe(true);

    await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
  });

  test('token lifecycle endpoints revoke current token', async () => {
    const loginOne = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const loginTwo = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const currentToken = loginTwo.body.data.token;

    const listRes = await request(app)
      .get('/api/auth/tokens')
      .set('Authorization', `Bearer ${currentToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);

    const oldestTokenId = listRes.body.data[listRes.body.data.length - 1].id;

    const revokeByIdRes = await request(app)
      .delete(`/api/auth/tokens/${oldestTokenId}`)
      .set('Authorization', `Bearer ${currentToken}`)
      .expect(200);

    expect(revokeByIdRes.body.data.revoked).toBe(true);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${currentToken}`)
      .expect(200);

    expect(logoutRes.body.data.revoked).toBe(true);

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${currentToken}`)
      .expect(401);

    await request(app)
      .delete('/api/auth/tokens')
      .set('Authorization', `Bearer ${loginOne.body.data.token}`)
      .expect(200);
  });
});

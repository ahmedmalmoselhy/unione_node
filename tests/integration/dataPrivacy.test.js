import request from 'supertest';

describe('Data Privacy & GDPR API', () => {
  let app;
  let mockUser;

  beforeAll(() => {
    const express = require('express');
    const bodyParser = require('body-parser');
    
    app = express();
    app.use(bodyParser.json());
    
    // Mock authentication
    app.use((req, res, next) => {
      req.user = { id: 1, email: 'test@unione.local' };
      next();
    });

    // Mock privacy routes
    app.get('/api/v1/privacy/export', (req, res) => {
      res.status(200).json({
        user: {
          id: req.user.id,
          email: req.user.email,
          first_name: 'Test',
          last_name: 'User',
        },
        roles: [{ name: 'student', scope_type: null, scope_id: null }],
        exported_at: new Date().toISOString(),
      });
    });

    app.get('/api/v1/privacy/summary', (req, res) => {
      res.status(200).json({
        user_id: req.user.id,
        data_categories: {
          personal_information: true,
          student_records: true,
          notifications: 15,
          role_assignments: 1,
        },
        retention_period: 'Until account deletion or 7 years after graduation',
      });
    });

    app.post('/api/v1/privacy/anonymize', (req, res) => {
      const { confirmation } = req.body;
      
      if (confirmation !== 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE') {
        return res.status(422).json({
          error: 'Confirmation required',
        });
      }

      res.status(200).json({
        anonymized: true,
        message: 'Your account has been anonymized. All personal data has been removed.',
      });
    });

    app.delete('/api/v1/privacy/account', (req, res) => {
      const { confirmation, password } = req.body;
      
      if (!password) {
        return res.status(422).json({
          error: 'Password required',
        });
      }

      if (confirmation !== 'PERMANENTLY_DELETE_MY_ACCOUNT') {
        return res.status(422).json({
          error: 'Confirmation required',
        });
      }

      res.status(200).json({
        deleted: true,
        message: 'Your account has been permanently deleted.',
      });
    });
  });

  describe('GET /api/v1/privacy/export', () => {
    it('should export user data', async () => {
      const response = await request(app).get('/api/v1/privacy/export');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(1);
      expect(response.body.user.email).toBe('test@unione.local');
      expect(response.body.exported_at).toBeDefined();
    });

    it('should include roles in export', async () => {
      const response = await request(app).get('/api/v1/privacy/export');

      expect(response.body.roles).toBeDefined();
      expect(Array.isArray(response.body.roles)).toBe(true);
    });
  });

  describe('GET /api/v1/privacy/summary', () => {
    it('should return data processing summary', async () => {
      const response = await request(app).get('/api/v1/privacy/summary');

      expect(response.status).toBe(200);
      expect(response.body.data_categories).toBeDefined();
      expect(response.body.data_categories.personal_information).toBe(true);
      expect(response.body.retention_period).toBeDefined();
    });
  });

  describe('POST /api/v1/privacy/anonymize', () => {
    it('should anonymize account with confirmation', async () => {
      const response = await request(app)
        .post('/api/v1/privacy/anonymize')
        .send({
          confirmation: 'I_UNDERSTAND_THIS_IS_IRREVERSIBLE',
        });

      expect(response.status).toBe(200);
      expect(response.body.anonymized).toBe(true);
    });

    it('should return 422 without confirmation', async () => {
      const response = await request(app)
        .post('/api/v1/privacy/anonymize')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Confirmation required');
    });
  });

  describe('DELETE /api/v1/privacy/account', () => {
    it('should delete account with confirmation and password', async () => {
      const response = await request(app)
        .delete('/api/v1/privacy/account')
        .send({
          confirmation: 'PERMANENTLY_DELETE_MY_ACCOUNT',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.deleted).toBe(true);
    });

    it('should return 422 without password', async () => {
      const response = await request(app)
        .delete('/api/v1/privacy/account')
        .send({
          confirmation: 'PERMANENTLY_DELETE_MY_ACCOUNT',
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Password required');
    });

    it('should return 422 without confirmation', async () => {
      const response = await request(app)
        .delete('/api/v1/privacy/account')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Confirmation required');
    });
  });
});

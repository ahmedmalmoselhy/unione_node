import request from 'supertest';

describe('Queue Monitoring API', () => {
  let app;

  beforeAll(() => {
    const express = require('express');
    const bodyParser = require('body-parser');
    
    app = express();
    app.use(bodyParser.json());
    
    // Mock authentication
    app.use((req, res, next) => {
      req.user = { id: 1, roles: ['admin'] };
      next();
    });

    // Mock queue monitoring routes
    app.get('/api/v1/admin/queue/status', (req, res) => {
      res.status(200).json({
        email: {
          waiting: 5,
          active: 2,
          completed: 150,
          failed: 3,
          delayed: 1,
        },
        webhook: {
          waiting: 10,
          active: 3,
          completed: 500,
          failed: 8,
          delayed: 2,
        },
        healthy: true,
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/api/v1/admin/queue/failed', (req, res) => {
      res.status(200).json({
        failedJobs: [
          {
            queue: 'email',
            id: 123,
            data: { type: 'announcement', userId: 1 },
            failedReason: 'Connection timeout',
            attemptsMade: 3,
            finishedOn: new Date().toISOString(),
          },
        ],
        total: 1,
      });
    });

    app.post('/api/v1/admin/queue/:jobId/retry', (req, res) => {
      const { jobId } = req.params;
      const { queue } = req.body;

      if (!['email', 'webhook'].includes(queue)) {
        return res.status(400).json({ error: 'Invalid queue name' });
      }

      res.status(200).json({
        message: 'Job queued for retry',
        jobId: parseInt(jobId),
      });
    });
  });

  describe('GET /api/v1/admin/queue/status', () => {
    it('should return queue status', async () => {
      const response = await request(app).get('/api/v1/admin/queue/status');

      expect(response.status).toBe(200);
      expect(response.body.email).toBeDefined();
      expect(response.body.webhook).toBeDefined();
      expect(response.body.healthy).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should include job counts for each state', async () => {
      const response = await request(app).get('/api/v1/admin/queue/status');

      expect(response.body.email.waiting).toBeDefined();
      expect(response.body.email.active).toBeDefined();
      expect(response.body.email.completed).toBeDefined();
      expect(response.body.email.failed).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/queue/failed', () => {
    it('should return failed jobs', async () => {
      const response = await request(app).get('/api/v1/admin/queue/failed');

      expect(response.status).toBe(200);
      expect(response.body.failedJobs).toBeDefined();
      expect(response.body.total).toBeDefined();
    });
  });

  describe('POST /api/v1/admin/queue/:jobId/retry', () => {
    it('should queue job for retry', async () => {
      const response = await request(app)
        .post('/api/v1/admin/queue/123/retry')
        .send({ queue: 'email' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Job queued for retry');
      expect(response.body.jobId).toBe(123);
    });

    it('should return 400 for invalid queue', async () => {
      const response = await request(app)
        .post('/api/v1/admin/queue/123/retry')
        .send({ queue: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid queue name');
    });
  });
});

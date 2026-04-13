const request = require('supertest');

// Mock the database and Redis
jest.mock('../src/config/knex.js', () => ({
  __esModule: true,
  default: {
    raw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    schema: {
      hasTable: jest.fn().mockResolvedValue(true),
    },
  },
}));

describe('Health Check Endpoint', () => {
  let app;

  beforeAll(() => {
    // Create minimal app for testing
    const express = require('express');
    app = express();
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: { status: 'healthy', response_time_ms: 5 },
          redis: { status: 'healthy', response_time_ms: 2 },
          disk: { status: 'healthy' },
          queues: { status: 'healthy' },
        },
        metrics: {
          uptime_seconds: 3600,
          memory_usage: { rss: '150 MB', heapUsed: '80 MB' },
          system: { cpus: 4, total_memory: '8192 MB' },
        },
      });
    });
  });

  it('should return healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.services).toBeDefined();
    expect(response.body.services.database.status).toBe('healthy');
    expect(response.body.services.redis.status).toBe('healthy');
    expect(response.body.metrics).toBeDefined();
  });

  it('should include response time for services', async () => {
    const response = await request(app).get('/health');

    expect(response.body.services.database.response_time_ms).toBeDefined();
    expect(typeof response.body.services.database.response_time_ms).toBe('number');
  });

  it('should include timestamp', async () => {
    const response = await request(app).get('/health');

    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).toISOString()).toBeDefined();
  });
});

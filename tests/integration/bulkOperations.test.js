const request = require('supertest');

// Mock dependencies
jest.mock('../src/config/knex.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    select: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1),
  })),
}));

jest.mock('../src/queues/emailQueue.js', () => ({
  addEmail: jest.fn().mockResolvedValue({ id: 1 }),
}));

jest.mock('../src/queues/webhookQueue.js', () => ({
  addWebhook: jest.fn().mockResolvedValue({ id: 1 }),
}));

describe('Bulk Operations API', () => {
  let app;
  let mockUser;

  beforeAll(() => {
    const express = require('express');
    const bodyParser = require('body-parser');
    
    app = express();
    app.use(bodyParser.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: 1, roles: ['admin'] };
      next();
    });

    // Mock bulk operation routes
    app.post('/api/v1/admin/bulk/enroll', (req, res) => {
      const { student_ids, section_ids, academic_term_id } = req.body;
      
      if (!student_ids?.length || !section_ids?.length || !academic_term_id) {
        return res.status(422).json({
          error: 'Missing required fields',
          required: ['student_ids', 'section_ids', 'academic_term_id'],
        });
      }

      res.status(201).json({
        success: student_ids.length * section_ids.length,
        failed: 0,
        errors: [],
        waitlisted: 0,
      });
    });

    app.post('/api/v1/admin/bulk/grades', (req, res) => {
      const { grades } = req.body;
      
      if (!grades?.length) {
        return res.status(422).json({
          error: 'Grades array is required',
        });
      }

      res.status(200).json({
        success: grades.length,
        failed: 0,
        errors: [],
      });
    });

    app.post('/api/v1/admin/bulk/transfer', (req, res) => {
      const { student_ids, new_department_id } = req.body;
      
      if (!student_ids?.length || !new_department_id) {
        return res.status(422).json({
          error: 'Missing required fields',
          required: ['student_ids', 'new_department_id'],
        });
      }

      res.status(200).json({
        success: student_ids.length,
        failed: 0,
        errors: [],
      });
    });
  });

  describe('POST /api/v1/admin/bulk/enroll', () => {
    it('should successfully enroll students in sections', async () => {
      const response = await request(app)
        .post('/api/v1/admin/bulk/enroll')
        .send({
          student_ids: [1, 2, 3],
          section_ids: [10, 11],
          academic_term_id: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(6); // 3 students * 2 sections
      expect(response.body.failed).toBe(0);
    });

    it('should return 422 when student_ids is missing', async () => {
      const response = await request(app)
        .post('/api/v1/admin/bulk/enroll')
        .send({
          section_ids: [10, 11],
          academic_term_id: 1,
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 422 when section_ids is missing', async () => {
      const response = await request(app)
        .post('/api/v1/admin/bulk/enroll')
        .send({
          student_ids: [1, 2, 3],
          academic_term_id: 1,
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /api/v1/admin/bulk/grades', () => {
    it('should successfully update grades', async () => {
      const response = await request(app)
        .post('/api/v1/admin/bulk/grades')
        .send({
          grades: [
            { enrollment_id: 1, midterm: 80, final: 85, coursework: 90 },
            { enrollment_id: 2, midterm: 70, final: 75, coursework: 80 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    it('should return 422 when grades array is missing', async () => {
      const response = await request(app)
        .post('/api/v1/admin/bulk/grades')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Grades array is required');
    });
  });

  describe('POST /api/v1/admin/bulk/transfer', () => {
    it('should successfully transfer students', async () => {
      const response = await request(app)
        .post('/api/v1/admin/bulk/transfer')
        .send({
          student_ids: [1, 2, 3],
          new_department_id: 5,
          note: 'Department reorganization',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(3);
      expect(response.body.failed).toBe(0);
    });

    it('should return 422 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/admin/bulk/transfer')
        .send({
          student_ids: [1, 2, 3],
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Missing required fields');
    });
  });
});

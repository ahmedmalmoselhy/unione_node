# UniOne API - OpenAPI/Swagger Specification

This document provides the OpenAPI 3.0 specification for the UniOne Node.js backend.

## Setup Instructions

### Option 1: Swagger UI (Recommended)

1. Install swagger-ui-express:
```bash
npm install swagger-ui-express
```

2. Create `src/config/openapi.js`:
```javascript
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'UniOne API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the UniOne University Management Platform',
    contact: {
      name: 'UniOne Team',
      email: 'admin@unione.local',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development',
    },
    {
      url: 'https://api.unione.local',
      description: 'Production',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    // Add all endpoint definitions here
  },
};

export { swaggerUi, swaggerDocument };
```

3. Add to `src/server.js`:
```javascript
import { swaggerUi, swaggerDocument } from './config/openapi.js';

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

4. Access at: `http://localhost:3000/docs`

### Option 2: Scalar API Documentation

1. Install @scalar/express-api-reference:
```bash
npm install @scalar/express-api-reference
```

2. Use same openapi.js config
3. Access beautiful auto-generated docs

## Key Endpoints to Document

### Authentication
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password
- POST /api/v1/auth/change-password

### Students
- GET /api/v1/student/profile
- GET /api/v1/student/enrollments
- POST /api/v1/student/enrollments
- DELETE /api/v1/student/enrollments/{id}
- GET /api/v1/student/grades
- GET /api/v1/student/transcript
- GET /api/v1/student/schedule

### Professors
- GET /api/v1/professor/profile
- GET /api/v1/professor/sections
- GET /api/v1/professor/sections/{id}/students
- POST /api/v1/professor/sections/{id}/grades

### Admin
- GET /api/v1/admin/students
- POST /api/v1/admin/students
- GET /api/v1/admin/professors
- GET /api/v1/admin/courses
- GET /api/v1/admin/sections
- POST /api/v1/admin/bulk/enroll
- POST /api/v1/admin/bulk/grades

### Analytics
- GET /api/v1/admin/analytics/enrollment-trends
- GET /api/v1/admin/analytics/student-performance/{id}
- GET /api/v1/admin/analytics/course-demand
- GET /api/v1/admin/analytics/professor-workload

### Health & Monitoring
- GET /health
- GET /api/v1/admin/monitoring/health
- GET /api/v1/admin/monitoring/logs
- GET /api/v1/admin/monitoring/metrics

### Privacy
- GET /api/v1/privacy/export
- POST /api/v1/privacy/anonymize
- DELETE /api/v1/privacy/account

---

**Last Updated**: April 12, 2026

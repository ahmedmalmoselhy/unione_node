# UniOne Node.js - Enhancement Roadmap

**Date**: April 12, 2026  
**Current Status**: 🟡 Active Development (~75% complete)  
**Backend**: ~85% complete | **Frontend**: 0% (not started)  
**Total Enhancements**: 20 items identified

---

## 📊 Executive Summary

The Node.js backend is **largely functional** with most API endpoints implemented. The critical gaps are:
1. **No Frontend** (React/TypeScript) - 100% missing
2. **Excel Import/Export** - CSV only currently
3. **Email Delivery** - Partially wired
4. **Background Job Queue** - Everything is synchronous
5. **Test Coverage** - Moderate (35 tests, no coverage target)

All enhancements below are rated by **Priority**, **Business Impact**, and **Implementation Volume**.

---

## 🎯 Enhancement Priority Matrix

### Rating Scale:

| Rating | Meaning |
|--------|---------|
| **Priority**: P0-P3 | P0=Critical, P1=High, P2=Medium, P3=Low |
| **Business Impact**: 1-5 | 1=Minimal, 3=Moderate, 5=Transformational |
| **Implementation Volume**: S/M/L/XL | S=<1 day, M=2-3 days, L=1 week, XL=2+ weeks |

---

## 🔴 P0 - Critical (Must Have Before Production)

### 1. **Frontend Application (React + TypeScript)**
**Priority**: P0 | **Impact**: 5/5 | **Volume**: XL (4-6 weeks)

**Problem**: API is completely functional but inaccessible to end users without UI.

**What's Missing:**
- Student Portal (15+ screens)
- Professor Portal (10+ screens)
- Admin Dashboard (20+ screens)
- Employee Portal (5+ screens)
- Authentication pages (Login, Register, Password Reset)
- 120+ React components specified in FRONTEND_GUIDE.md

**Implementation Plan:**
```
Week 1: Project scaffolding + Auth flow
Week 2: Student Portal core (profile, enrollments, grades)
Week 3: Student Portal advanced (transcript, schedule, attendance)
Week 4: Professor Portal (sections, grading, attendance)
Week 5: Admin Dashboard (CRUD operations)
Week 6: Admin advanced features + polish
```

**Tech Stack:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + HeadlessUI
- Redux Toolkit (state management)
- React Query (API caching)
- React Router 6

**Estimated Effort**: 4-6 weeks full-time

**Dependencies to Add:**
```json
{
  "@reduxjs/toolkit": "^2.0",
  "@tanstack/react-query": "^5.0",
  "react-router-dom": "^6.20",
  "tailwindcss": "^3.4",
  "axios": "^1.6"
}
```

---

### 2. **Excel Import/Export (.xlsx/.xls)**
**Priority**: P0 | **Impact**: 5/5 | **Volume**: M (2-3 days)

**Problem**: Users must manually convert Excel files to CSV before importing. Major UX barrier.

**What's Missing:**
- Excel parsing for student imports
- Excel parsing for professor imports
- Excel parsing for grade imports
- Excel export (not just CSV)

**Implementation:**
```javascript
// Add dependency
npm install xlsx

// Update import controllers to accept .xlsx
const XLSX = require('xlsx');

function parseExcelFile(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}
```

**Files to Modify:**
- `src/controllers/adminImportController.js`
- `src/services/importService.js`
- Add Excel template generation

**Acceptance Criteria:**
- ✅ Accept .xlsx and .xls files
- ✅ Validate data types and constraints
- ✅ Show preview before import
- ✅ Export to Excel with formatting

**Estimated Effort**: 2-3 days

---

### 3. **Background Job Queue System**
**Priority**: P0 | **Impact**: 5/5 | **Volume**: L (1 week)

**Problem**: All email sends and webhook deliveries are synchronous, blocking API responses.

**Current State:**
```javascript
// BAD: Synchronous email send (blocks response)
await emailDeliveryService.sendAnnouncementEmail(userId, announcement);
res.json({ success: true });
```

**Target State:**
```javascript
// GOOD: Asynchronous job queue
await jobQueue.add('send-email', { userId, announcement });
res.json({ success: true }); // Immediate response
```

**Implementation Plan:**

**Step 1**: Install Bull + Redis
```bash
npm install bull redis
```

**Step 2**: Create queue configuration
```javascript
// src/queues/emailQueue.js
const Queue = require('bull');
const emailQueue = new Queue('email-delivery', {
  redis: { host: '127.0.0.1', port: 6379 }
});

emailQueue.process(async (job) => {
  const { type, data } = job.data;
  await emailService.send(type, data);
});

module.exports = emailQueue;
```

**Step 3**: Migrate existing flows
- Webhook dispatch → `webhookQueue`
- Email delivery → `emailQueue`
- Import processing → `importQueue`

**Queues to Create:**
| Queue | Purpose | Retry | Priority |
|-------|---------|-------|----------|
| `email-queue` | Announcement, grade, exam emails | 3 attempts | High |
| `webhook-queue` | Outbound webhook deliveries | 5 attempts | Medium |
| `import-queue` | CSV/Excel import processing | 2 attempts | Low |
| `export-queue` | CSV/Excel export generation | 2 attempts | Low |

**Files to Create:**
- `src/queues/emailQueue.js`
- `src/queues/webhookQueue.js`
- `src/queues/importQueue.js`
- `src/queues/exportQueue.js`
- `src/workers/emailWorker.js`
- `src/workers/webhookWorker.js`

**Estimated Effort**: 1 week

---

## 🟠 P1 - High Priority (Should Have)

### 4. **Complete Email Delivery System**
**Priority**: P1 | **Impact**: 4/5 | **Volume**: M (2-3 days)

**Problem**: Email delivery exists but is incomplete. General announcements don't send emails.

**What Needs Fixing:**
- General announcement emails (currently missing)
- Exam schedule publication emails (partially wired)
- Final grade emails (partially wired)
- Email templates for all notification types

**Implementation:**
```javascript
// Fix announcementController.js
async createAnnouncement(req, res) {
  const announcement = await Announcement.create(req.body);
  
  // TODO: Queue email to all target users
  await emailQueue.add('announcement', {
    announcementId: announcement.id,
    scope: announcement.scope,
    targetId: announcement.target_id
  });
  
  res.json(announcement);
}
```

**Email Templates Needed:**
- New announcement email
- Exam schedule published email
- Final grade published email
- Waitlist promotion email
- Enrollment confirmation email

**Files to Modify:**
- `src/controllers/announcementController.js`
- `src/services/emailDeliveryService.js` (expand)
- Add `src/templates/emails/` directory

**Estimated Effort**: 2-3 days

---

### 5. **Test Coverage Expansion to 80%+**
**Priority**: P1 | **Impact**: 4/5 | **Volume**: L (1-2 weeks)

**Current State**: 35 integration tests, no unit tests, no coverage tracking

**Target State**: 80%+ coverage with unit + integration + E2E tests

**Implementation Plan:**

**Phase 1**: Unit Tests for Services (3-4 days)
- `GpaService` calculations
- `EnrollmentService` validation logic
- `AuthService` token generation
- `EmailDeliveryService` template rendering

**Phase 2**: Integration Tests for APIs (3-4 days)
- All admin CRUD endpoints
- Student enrollment flows
- Professor grading flows
- Webhook delivery flows

**Phase 3**: E2E Tests (2-3 days)
- Complete student enrollment journey
- Complete professor grading journey
- Admin bulk operations

**Phase 4**: Coverage Reporting (1 day)
```json
// package.json
{
  "scripts": {
    "test:coverage": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":80}}'"
  }
}
```

**Test Structure:**
```
tests/
├── unit/
│   ├── services/
│   │   ├── gpaService.test.js
│   │   ├── enrollmentService.test.js
│   │   └── authService.test.js
│   └── utils/
│       └── validators.test.js
├── integration/
│   ├── api/
│   │   ├── auth.test.js
│   │   ├── students.test.js
│   │   └── professors.test.js
│   └── controllers/
│       └── announcementController.test.js
└── e2e/
    ├── enrollmentJourney.test.js
    └── gradingFlow.test.js
```

**Estimated Effort**: 1-2 weeks

---

### 6. **API Versioning (/api/v1/)**
**Priority**: P1 | **Impact**: 4/5 | **Volume**: S (1 day)

**Problem**: No API versioning. Breaking changes will break existing clients.

**Implementation:**
```javascript
// src/routes/index.js
const express = require('express');
const router = express.Router();

// Version 1 routes
router.use('/v1', require('./v1'));

// Backward compatibility - redirect old routes
router.use('*', (req, res) => {
  res.status(410).json({
    message: 'API versioning is now required.',
    redirect: `/api/v1${req.path}`,
    documentation: `${process.env.APP_URL}/docs`
  });
});

module.exports = router;
```

**Migration Steps:**
1. Create `src/routes/v1/` directory
2. Move all existing routes to `src/routes/v1/`
3. Update route registrations in `server.js`
4. Add backward compatibility redirect

**Files to Modify:**
- `src/routes/index.js` (restructure)
- `src/server.js` (route mounting)

**Estimated Effort**: 1 day

---

### 7. **Course Prerequisite Enforcement**
**Priority**: P1 | **Impact**: 4/5 | **Volume**: M (2 days)

**Problem**: `course_prerequisites` table exists but enforcement in enrollment flow is unverified.

**Implementation:**
```javascript
// src/services/enrollmentService.js
async validatePrerequisites(studentId, courseId) {
  // Get course prerequisites
  const prerequisites = await knex('course_prerequisites')
    .where('course_id', courseId)
    .join('courses', 'course_prerequisites.prerequisite_id', 'courses.id')
    .select('courses.id', 'courses.code', 'courses.name');
  
  if (prerequisites.length === 0) return true; // No prerequisites
  
  // Check if student completed all prerequisites
  const completedCourses = await knex('enrollments')
    .join('sections', 'enrollments.section_id', 'sections.id')
    .where('enrollments.student_id', studentId)
    .whereIn('enrollments.status', ['completed', 'passed'])
    .pluck('sections.course_id');
  
  const missing = prerequisites.filter(
    prereq => !completedCourses.includes(prereq.id)
  );
  
  if (missing.length > 0) {
    throw new ValidationError('Prerequisites not met', { missing });
  }
  
  return true;
}
```

**Files to Modify:**
- `src/services/enrollmentService.js` (add validation)
- `src/controllers/studentEnrollmentController.js` (call validation)

**Estimated Effort**: 2 days

---

## 🟡 P2 - Medium Priority (Nice to Have)

### 8. **Redis Caching Layer**
**Priority**: P2 | **Impact**: 3/5 | **Volume**: M (3-4 days)

**Problem**: No caching layer. Every request hits the database.

**What to Cache:**
| Resource | TTL | Strategy |
|----------|-----|----------|
| Organization hierarchy | 1 hour | Tag-based invalidation |
| Course catalog | 30 min | Time-based expiry |
| Student profile | 15 min | Write-through |
| User permissions | 10 min | Event-based invalidation |
| Analytics results | 5 min | Time-based expiry |

**Implementation:**
```javascript
// src/services/cacheService.js
const redis = require('redis');
const client = redis.createClient();

class CacheService {
  static async get(key) {
    const data = await client.get(`unione:${key}`);
    return data ? JSON.parse(data) : null;
  }
  
  static async set(key, data, ttl = 3600) {
    await client.setEx(`unione:${key}`, ttl, JSON.stringify(data));
  }
  
  static async invalidate(pattern) {
    const keys = await client.keys(`unione:${pattern}*`);
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
}

module.exports = CacheService;
```

**Files to Create:**
- `src/services/cacheService.js`
- `src/middleware/cacheMiddleware.js`

**Dependencies:**
```bash
npm install redis
```

**Estimated Effort**: 3-4 days

---

### 9. **Monitoring & Observability**
**Priority**: P2 | **Impact**: 3/5 | **Volume**: M (2-3 days)

**Problem**: No error tracking, no performance monitoring, basic health check only.

**Implementation:**

**1. Sentry Integration** (Error Tracking)
```bash
npm install @sentry/node @sentry/tracing
```

```javascript
// src/config/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

module.exports = Sentry;
```

**2. Enhanced Health Check**
```javascript
// src/controllers/healthController.js
async healthCheck(req, res) {
  const services = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDisk(),
    queue: await checkQueue(),
  };
  
  const status = Object.values(services).every(s => s.healthy)
    ? 'healthy'
    : 'degraded';
  
  res.json({ status, services, timestamp: new Date().toISOString() });
}
```

**3. Structured Logging**
```javascript
// Replace morgan with winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

**Files to Create:**
- `src/config/sentry.js`
- `src/controllers/healthController.js` (enhanced)
- `src/utils/logger.js` (winston)

**Dependencies:**
```bash
npm install @sentry/node winston
```

**Estimated Effort**: 2-3 days

---

### 10. **Student Transfer History Tracking**
**Priority**: P2 | **Impact**: 3/5 | **Volume**: S (1 day)

**Problem**: Transfer endpoint exists but may not create history records.

**Implementation:**
```javascript
// src/controllers/adminStudentController.js
async transferStudent(req, res) {
  const { studentId } = req.params;
  const { newDepartmentId, note } = req.body;
  
  const student = await Student.findById(studentId);
  const oldDepartmentId = student.department_id;
  
  await knex.transaction(async (trx) => {
    // Update student
    await trx('students')
      .where('id', studentId)
      .update({ department_id: newDepartmentId });
    
    // Record history
    await trx('student_department_history').insert({
      student_id: studentId,
      old_department_id: oldDepartmentId,
      new_department_id: newDepartmentId,
      switched_by: req.user.id,
      switched_at: new Date(),
      note: note || null,
    });
  });
  
  res.json({ message: 'Student transferred successfully' });
}
```

**Files to Modify:**
- `src/controllers/adminStudentController.js`
- `src/services/studentService.js`

**Estimated Effort**: 1 day

---

### 11. **File Upload & Avatar Management**
**Priority**: P2 | **Impact**: 3/5 | **Volume**: M (2-3 days)

**Problem**: No user profile image uploads.

**Implementation:**
```javascript
// src/controllers/authController.js
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

async uploadAvatar(req, res) {
  upload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    
    // Upload to cloud storage (AWS S3, Cloudinary, etc.)
    const url = await cloudStorage.upload(req.file);
    
    await knex('users')
      .where('id', req.user.id)
      .update({ avatar_url: url });
    
    res.json({ avatar_url: url });
  });
}
```

**Files to Create:**
- `src/services/cloudStorageService.js`
- Update auth controllers with upload endpoints

**Dependencies:**
```bash
npm install multer @aws-sdk/client-s3
```

**Estimated Effort**: 2-3 days

---

## 🟢 P3 - Low Priority (Future Enhancements)

### 12. **Real-time Notifications (Socket.io)**
**Priority**: P3 | **Impact**: 2/5 | **Volume**: L (1 week)

**What**: WebSocket support for live notification delivery

**Estimated Effort**: 1 week

---

### 13. **Advanced Analytics & Predictive Insights**
**Priority**: P3 | **Impact**: 2/5 | **Volume**: L (1-2 weeks)

**What**: Enrollment forecasting, student performance prediction

**Estimated Effort**: 1-2 weeks

---

### 14. **TypeScript Migration**
**Priority**: P3 | **Impact**: 2/5 | **Volume**: XL (3-4 weeks)

**What**: Migrate entire codebase from JavaScript to TypeScript

**Estimated Effort**: 3-4 weeks

---

### 15. **Third-party Integrations (LMS/SSO/Payment)**
**Priority**: P3 | **Impact**: 2/5 | **Volume**: XL (2-4 weeks per integration)

**What**: Moodle, Canvas, SAML SSO, Stripe

**Estimated Effort**: 2-4 weeks per integration

---

### 16. **Bulk Operations**
**Priority**: P3 | **Impact**: 2/5 | **Volume**: M (3-4 days)

**What**: Batch enrollment, grade updates, student transfers

**Estimated Effort**: 3-4 days

---

### 17. **Data Privacy & GDPR Features**
**Priority**: P3 | **Impact**: 2/5 | **Volume**: M (2-3 days)

**What**: Data export, account anonymization

**Estimated Effort**: 2-3 days

---

## 📊 Implementation Priority Matrix

| # | Enhancement | Priority | Impact | Volume | Effort | Phase |
|---|-------------|----------|--------|--------|--------|-------|
| 1 | **Frontend Application** | P0 | 5/5 | XL | 4-6 weeks | Phase 1 |
| 2 | **Excel Import/Export** | P0 | 5/5 | M | 2-3 days | Phase 1 |
| 3 | **Background Job Queue** | P0 | 5/5 | L | 1 week | Phase 1 |
| 4 | **Complete Email Delivery** | P1 | 4/5 | M | 2-3 days | Phase 2 |
| 5 | **Test Coverage 80%+** | P1 | 4/5 | L | 1-2 weeks | Phase 2 |
| 6 | **API Versioning** | P1 | 4/5 | S | 1 day | Phase 2 |
| 7 | **Course Prerequisite Enforcement** | P1 | 4/5 | M | 2 days | Phase 2 |
| 8 | **Redis Caching Layer** | P2 | 3/5 | M | 3-4 days | Phase 3 |
| 9 | **Monitoring & Observability** | P2 | 3/5 | M | 2-3 days | Phase 3 |
| 10 | **Student Transfer History** | P2 | 3/5 | S | 1 day | Phase 3 |
| 11 | **File Upload & Avatars** | P2 | 3/5 | M | 2-3 days | Phase 3 |
| 12 | **Real-time Notifications** | P3 | 2/5 | L | 1 week | Phase 4 |
| 13 | **Advanced Analytics** | P3 | 2/5 | L | 1-2 weeks | Phase 4 |
| 14 | **TypeScript Migration** | P3 | 2/5 | XL | 3-4 weeks | Phase 4 |
| 15 | **Third-party Integrations** | P3 | 2/5 | XL | 2-4 weeks | Phase 4 |
| 16 | **Bulk Operations** | P3 | 2/5 | M | 3-4 days | Phase 4 |
| 17 | **Data Privacy & GDPR** | P3 | 2/5 | M | 2-3 days | Phase 4 |

---

## 🎯 Recommended Implementation Phases

### Phase 1: Production Readiness (Weeks 1-4)

**Goal**: Make the platform production-ready for API consumers

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Background Job Queue + Excel | Bull setup, Excel import/export |
| **Week 2** | Email Delivery Completion | All email templates, queue integration |
| **Week 3** | API Versioning + Prerequisites | /api/v1/ routes, prerequisite enforcement |
| **Week 4** | Test Coverage Sprint | Unit tests, coverage reporting |

**Outcome**: ✅ Production-ready backend with 85%+ completion

---

### Phase 2: Frontend Foundation (Weeks 5-10)

**Goal**: Complete React frontend for all portals

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 5** | Project Scaffolding + Auth | Vite, React, Redux, login pages |
| **Week 6** | Student Portal Core | Profile, enrollments, grades |
| **Week 7** | Student Portal Advanced | Transcript, schedule, attendance |
| **Week 8** | Professor Portal | Sections, grading, attendance |
| **Week 9** | Admin Dashboard Core | CRUD operations, imports/exports |
| **Week 10** | Admin Advanced + Polish | Analytics, settings, bug fixes |

**Outcome**: ✅ Full-stack application with UI

---

### Phase 3: Performance & Scalability (Weeks 11-12)

**Goal**: Optimize for production scale

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 11** | Caching + Monitoring | Redis, Sentry, health checks |
| **Week 12** | File Uploads + Transfer History | Avatar uploads, audit trail |

**Outcome**: ✅ Production-optimized performance

---

### Phase 4: Advanced Features (Weeks 13-18)

**Goal**: Enterprise-grade features

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 13-14** | Real-time Features | Socket.io, live notifications |
| **Week 15-16** | Advanced Analytics | Predictive insights, forecasting |
| **Week 17** | Bulk Operations | Batch enrollment, grade updates |
| **Week 18** | GDPR Compliance | Data export, anonymization |

**Outcome**: ✅ Enterprise-grade platform

---

### Phase 5: Future Enhancements (Months 5-6)

**Goal**: Long-term strategic improvements

- TypeScript migration (optional, 3-4 weeks)
- Third-party integrations (LMS, SSO, Payment)
- Mobile app API optimization
- Advanced machine learning features

---

## 💡 Quick Wins (Implement First)

These items have **high impact** but **low effort**:

| # | Enhancement | Impact | Effort | Why First? |
|---|-------------|--------|--------|------------|
| 6 | API Versioning | 4/5 | 1 day | Safe future evolution |
| 7 | Prerequisite Enforcement | 4/5 | 2 days | Critical for enrollment integrity |
| 10 | Student Transfer History | 3/5 | 1 day | Audit compliance |

**Total Time**: 4 days for 3 high-impact enhancements

---

## 📦 Dependencies Summary

### Required Immediately (Phase 1):

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "bull": "^4.12.0",
    "redis": "^4.6.11"
  }
}
```

### Required Soon (Phase 2-3):

```json
{
  "dependencies": {
    "@sentry/node": "^7.91.0",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "@aws-sdk/client-s3": "^3.485.0"
  }
}
```

### Frontend (Phase 2):

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

---

## 🎯 Success Metrics

### Phase 1 Success Criteria:
- [ ] Background jobs processing asynchronously
- [ ] Excel files accepted for import
- [ ] All emails sent via queue
- [ ] API versioned at /api/v1/
- [ ] Test coverage at 80%+

### Phase 2 Success Criteria:
- [ ] Student portal fully functional
- [ ] Professor portal fully functional
- [ ] Admin dashboard fully functional
- [ ] All 120+ components implemented
- [ ] User can complete all core journeys

### Phase 3 Success Criteria:
- [ ] Response times < 200ms (cached)
- [ ] Error tracking via Sentry
- [ ] Health check endpoint comprehensive
- [ ] Avatar uploads working
- [ ] Audit trail for transfers

### Phase 4 Success Criteria:
- [ ] Real-time notifications working
- [ ] Predictive analytics available
- [ ] Bulk operations functional
- [ ] GDPR compliance verified

---

## 🚀 Next Immediate Steps

### Week 1, Day 1-2:
1. Install `xlsx` and `bull` dependencies
2. Set up Redis locally (`docker run -d -p 6379:6379 redis:7`)
3. Create `src/queues/` directory structure
4. Migrate email delivery to queue

### Week 1, Day 3-5:
1. Implement Excel import for students
2. Implement Excel import for professors
3. Implement Excel import for grades
4. Add Excel export with formatting

---

**Status**: 🟢 Ready for Implementation  
**Priority Order**: Follow Phase 1 → Phase 2 → Phase 3 → Phase 4  
**Estimated Total Timeline**: 18 weeks (4.5 months) to enterprise-grade  
**Minimum Viable Product**: Phase 1 + Phase 2 (10 weeks)

---

**Last Updated**: April 12, 2026  
**Maintained By**: UniOne Development Team  
**Next Review**: After Phase 1 completion

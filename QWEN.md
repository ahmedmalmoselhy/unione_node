# UniOne Platform - Node.js Backend

## Project Overview

**UniOne** is a comprehensive university management platform built with **Node.js + Express.js + PostgreSQL**. It provides role-based academic management for universities with multi-tier organizational structure (Universities → Faculties → Departments) and supports 6 user roles (Admin, Faculty Admin, Department Admin, Professor, Student, Employee).

### Key Features

- **Student Portal**: Course enrollment, grades, transcripts, attendance tracking
- **Professor Portal**: Grade submission, attendance management, announcements
- **Admin Portal**: System management, webhooks, audit logs, CSV import/export
- **Authentication**: JWT-based auth with rate limiting, password reset, token lifecycle
- **Communication**: Announcements, notifications with preferences and quiet hours
- **Advanced**: PDF transcripts, iCal schedules, webhook event dispatch, email delivery
- **Multi-language**: Locale preference endpoint (EN/AR support)

### Technology Stack

| Category | Technology |
| ---------- | ----------- |
| **Runtime** | Node.js 18+ (ES Modules) |
| **Framework** | Express.js |
| **Database** | PostgreSQL 12+ |
| **Query Builder** | Knex.js |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **Validation** | Joi |
| **Security** | Helmet, CORS, Express Rate Limit |
| **File Handling** | Multer |
| **PDF Generation** | PDFKit |
| **Email** | Nodemailer |
| **Testing** | Jest + Supertest |
| **Linting** | ESLint |
| **Dev Server** | Nodemon |

---

## Project Structure

```bash
unione_node/
├── src/
│   ├── config/              # Database & Knex configuration (2 files)
│   ├── middleware/          # Auth, authorization, rate limiting, error handling, locale (6 files)
│   ├── models/              # Database models via Knex (14 files)
│   ├── routes/              # API route definitions (24 files)
│   ├── controllers/         # Request handlers (24 files)
│   ├── services/            # Business logic layer (24 files)
│   ├── utils/               # Helpers: JWT, password, response, validators, AppError (8 files)
│   ├── validators/          # Joi validation schemas (10 files)
│   ├── scripts/             # Database seeding scripts (4 files)
│   └── server.js            # Express app entry point
├── migrations/              # Knex migrations (51 files, 34+ tables)
├── seeds/                   # Database seeders (21 files)
├── tests/                   # Jest integration tests
├── .env.example             # Environment variable template
├── package.json             # Dependencies and scripts
├── jest.config.cjs          # Jest configuration
└── .eslintrc.cjs            # ESLint configuration
```

### Architecture Pattern

The codebase follows a **layered architecture**:

```bash
Routes → Controllers → Services → Models → Database (via Knex)
                ↓
           Validators (input validation)
                ↓
           Utils (shared helpers)
```

---

## Building and Running

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 12.x or higher
- **npm** package manager

### Setup Commands

```bash
# Install dependencies
npm install

# Configure environment (copy and edit .env)
cp .env.example .env

# Run database migrations
npx knex migrate:latest

# Seed the database
npm run seed:run

# Seed with fresh data (drops & reseeds)
npm run seed:run:fresh

# Verify seed parity
npm run seed:verify
```

### Development

```bash
npm run dev            # Start dev server with auto-reload (port 3000)
npm start              # Start production server
```

Server will be available at `http://localhost:3000` with health check at `/health`.

### Testing

```bash
npm test               # Run all tests once
npm run test:watch     # Run tests in watch mode
```

Test files are located in `tests/**/*.test.js` and use Jest with Supertest.

### Linting

```bash
npm run lint           # Check code style
npm run lint:fix       # Auto-fix linting issues
```

### Database Commands (Knex)

```bash
npx knex migrate:make <name>     # Create new migration
npx knex migrate:latest          # Run all pending migrations
npx knex migrate:rollback        # Revert last migration batch
npx knex seed:make <name>        # Create new seeder
npx knex seed:run                # Run all seeders
```

---

## API Overview

The backend exposes **52+ REST API endpoints** across multiple domains:

| Domain | Route Prefix | Description |
| -------- | ------------- | ------------- |
| **Auth** | `/api/auth/*` | Login, logout, password reset, profile, token management |
| **Organization** | `/api/organization/*` | Universities, faculties, departments CRUD |
| **Student** | `/api/student/*` | Profile, enrollments, grades, transcripts, schedule, attendance, ratings |
| **Professor** | `/api/professor/*` | Profile, sections, grades, attendance, announcements, schedule |
| **Announcements** | `/api/announcements/*` | University-wide announcement management |
| **Notifications** | `/api/notifications/*` | Notification center, preferences, quiet hours |
| **Webhooks** | `/api/webhooks/*` | Webhook dispatch, dead-letter queue, retry |
| **Admin** | `/api/admin/*` | Analytics, dashboard, exports, imports, CRUD for all resources |
| **Locale** | `/api/locale` | Language preference (EN/AR) |

### Authentication

All protected routes require `Authorization: Bearer <jwt_token>` header. JWT tokens are configured with a 7-day expiration via `JWT_EXPIRE` env variable.

---

## Database

### Schema

The database contains **34+ tables** covering:

- **User & Organization**: users, roles, role_user, universities, faculties, departments
- **Academic**: courses, sections, enrollments, academic_terms, student_term_gpas
- **Grading**: grades, course_ratings, student_department_histories
- **Communication**: announcements, announcement_reads, section_announcements
- **Attendance**: attendance_sessions, attendance_records
- **System**: audit_logs, webhooks, webhook_deliveries, notifications, password_reset_tokens, personal_access_tokens
- **Advanced**: enrollment_waitlist, notification_preferences, notification_quiet_hours, section_teaching_assistants, exam_schedules, group_projects

### Migrations

All migrations are in the `migrations/` directory using Knex. They follow Laravel-parity schema and are designed to mirror the original Laravel backend database structure.

### Seeders

Database seeders are in the `seeds/` directory and run in order (see `seeds/000_seed_order.md`). The seeding pipeline supports:

- Fresh seeding (`npm run seed:run:fresh`) - drops and reseeds all data
- Verify parity (`npm run seed:verify`) - validates seed data integrity

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description | Default |
| ---------- | ------------- | --------- |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `127.0.0.1` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `unione_db` |
| `DB_USER` | Database user | `unione` |
| `DB_PASSWORD` | Database password | *(empty)* |
| `JWT_SECRET` | JWT signing secret | *(required)* |
| `JWT_EXPIRE` | JWT token expiration | `7d` |
| `MAIL_HOST` | SMTP host | `localhost` |
| `MAIL_PORT` | SMTP port | `1025` |
| `LOG_LEVEL` | Logging verbosity | `debug` |

---

## Development Conventions

### Code Style

- **ES Modules** (`"type": "module"` in package.json)
- **ESLint** configured with Node.js + ES2022 environment
- **No unused vars** enforced (with `_` prefix exception)
- **Console logging** is allowed (no `no-console` rule)

### File Naming

- **Models**: `<entity>Model.js` (e.g., `userModel.js`)
- **Routes**: `<domain>Routes.js` (e.g., `studentRoutes.js`)
- **Controllers**: `<domain>Controller.js` (e.g., `studentController.js`)
- **Services**: `<domain>Service.js` (e.g., `studentService.js`)
- **Validators**: `<domain>Validators.js` (e.g., `studentValidators.js`)
- **Middleware**: descriptive names (e.g., `authenticate.js`, `authorize.js`)

### Error Handling

- Centralized error handler in `src/middleware/errorHandler.js`
- Custom `AppError` class in `src/utils/AppError.js` for application errors
- Consistent response format via `src/utils/response.js`

### Testing Stack

- **Framework**: Jest with `testEnvironment: 'node'`
- **Test pattern**: `tests/**/*.test.js`
- **HTTP testing**: Supertest for API endpoint tests
- **Single worker**: `maxWorkers: 1` for test isolation
- Coverage for: auth flows, organization authorization, student/professor domains, enrollment, waitlist, grades, attendance, announcements, notifications, exports, scoped admin access

---

## Current Implementation Status

### ✅ Completed

- Database migrations (34+ tables) and seeders
- Core models: User, Role, University, Faculty, Department, Professor, Student
- Full authentication system (login, logout, password reset, token lifecycle)
- Auth middleware and role-based authorization
- Organization CRUD (universities, faculties, departments)
- Student portal: profile, enrollments, grades, transcript PDF, schedule iCal, attendance, ratings, academic history, waitlist
- Professor portal: profile, sections, grades submission, attendance, announcements, schedule iCal
- Announcement management (university-wide and section-specific)
- Notification center with preferences, quiet hours, read-all
- Webhook dispatch pipeline with dead-letter queue and exponential backoff
- Admin: analytics, dashboard stats, audit logs, CSV exports/imports, academic terms, courses, sections, professors, students, employees, enrollments, grades, assignments, reports
- Locale preference endpoint (EN/AR)
- Rate limiting on auth and module routes
- ESLint configuration
- Integration tests for auth, organization, student/professor, announcements, notifications, scoped admin access
- GitHub Actions CI workflow (`.github/workflows/node.yml`)

### ⏳ Remaining Work

- Frontend React application (not yet created)
- Comprehensive E2E test coverage
- Outbound email delivery testing with real SMTP infrastructure
- Production observability hardening and alerting

---

## Key Commands Quick Reference

```bash
# Development
npm run dev                    # Start dev server with auto-reload

# Database
npx knex migrate:latest        # Run migrations
npm run seed:run              # Seed database
npm run seed:run:fresh        # Fresh seed (drop & reseed)
npm run seed:verify           # Verify seed parity

# Testing
npm test                      # Run tests
npm run test:watch            # Watch mode

# Linting
npm run lint                  # Check style
npm run lint:fix              # Fix style issues
```

---

## Documentation

This project has extensive documentation in the root directory:

| File | Purpose |
| ------ | --------- |
| `README.md` | Project overview and quick start |
| `QUICK_REFERENCE.md` | Common commands and endpoints |
| `PROJECT_OVERVIEW.md` | Complete project summary and architecture |
| `IMPLEMENTATION_PLAN.md` | Detailed 8-phase implementation roadmap |
| `FRONTEND_GUIDE.md` | React development guide (frontend not yet created) |
| `API_ENDPOINTS.md` | All 52+ API endpoints documented |
| `DATABASE_SCHEMA.md` | All 34+ tables with relationships |
| `FEATURES_REFERENCE.md` | Feature matrix and user roles |
| `DEPENDENCIES_SETUP.md` | Dependencies and setup instructions |
| `DOCUMENTATION_INDEX.md` | Guide to all documentation by role |
| `CURRENT_STATUS.md` | Up-to-date implementation status report |

---

## Notes for Development

1. **Database**: The project mirrors an existing Laravel backend's database schema. All migrations and seeders are designed for parity with the Laravel implementation.
2. **Authorization**: Admin routes use scoped access control - admins can only manage resources within their scope (university, faculty, or department level).
3. **Webhooks**: Event dispatch occurs on enrollment, grade, and attendance changes. The webhook pipeline includes retry logic with exponential backoff.
4. **Exports**: Admin export endpoints generate CSV files. Import endpoints accept CSV uploads with validation.
5. **Email**: Outbound email delivery is implemented for section announcements, exam-schedule publication, and final-grade publication events.
6. **Testing**: CI runs on push/PR to `master` via GitHub Actions with PostgreSQL service, migration/seed bootstrap, and automated test execution.

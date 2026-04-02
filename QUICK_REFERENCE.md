# UniOne Quick Reference Card

> **Print this** or bookmark for fast lookups during development

---

## 🚀 Essential Commands

### Backend Setup

```bash
npm install                          # ✅ DONE
npm run dev                          # Start server (port 3000)
npm test                             # Run tests
npx knex migrate:latest              # Apply migrations
npx knex migrate:make <name>         # Create migration
npx knex seed:run                    # Run seeders
npm run lint                         # Check code style
```

### Frontend Setup (When Ready)

```bash
npm create vite@latest unione_frontend -- --template react-ts
cd unione_frontend
npm install
npm run dev                          # Dev server (port 5173)
npm run build                        # Production build
npm run preview                      # Preview build
npm test                             # Run tests
```

---

## 📊 System at a Glance

| Aspect | Details |
| -------- | --------- |
| **User Roles** | Admin (6), Faculty (5), Department Head (5), Professor (6), Student (4), Guest (1) |
| **Database Tables** | 34 total (27 core models + 7 system) |
| **API Endpoints** | 52+ REST endpoints |
| **Components** | 120+ React components planned |
| **Portals** | 4 (Admin, Professor, Student, Manager) |
| **Timeline** | 7-8 weeks (parallel backend + frontend) |
| **Tech Stack** | Node.js + Express + PostgreSQL + React |

---

## 📁 Database Tables (Quick Reference)

### Core (27 Models)

**Users**: User, Role, Admin, Faculty, Student  
**Organization**: University, Faculty, Department, Building, Room  
**Academic**: Course, Section, Semester, Schedule, Prerequisite  
**Enrollment**: StudentCourse, Attendance, Grade, GradeScale, Transcript  
**Communication**: AnnouncementBoard, Notification, PrivateMessage, DocumentLibrary  
**System**: Audit, DeviceToken, WebhookToken

### System (7 Tables)

logs, migrations, cache, config, session, failed_jobs, webhook_logs

---

## 🔌 API Endpoint Categories

### Authentication (10 endpoints)

`POST /api/auth/login` • `POST /api/auth/logout` • `POST /api/auth/refresh`  
`GET /api/me` • `POST /api/auth/change-password` • `POST /api/auth/forgot-password`  
`POST /api/auth/reset-password` • `POST /api/auth/verify-email` • `POST /api/auth/resend-verification`

### Student Portal (15 endpoints)

`GET /api/student/dashboard` • `GET /api/student/courses` • `GET /api/student/schedule`  
`GET /api/student/grades` • `POST /api/student/enroll` • `GET /api/student/transcripts`  
`GET /api/student/attendance` • `POST /api/student/drop-course` • `GET /api/student/notifications`  

+ More...

### Professor Portal (13 endpoints)

`GET /api/professor/dashboard` • `GET /api/professor/courses` • `POST /api/professor/post-grade`  
`GET /api/professor/attendance` • `POST /api/professor/mark-attendance` • `GET /api/professor/students`  

+ More...

### Admin Portal (5 endpoints)

`GET /api/admin/analytics` • `GET /api/admin/reports` • `POST /api/admin/users`  
`DELETE /api/admin/users/:id` • `PATCH /api/admin/users/:id`

### Shared (8 endpoints)

`GET /api/universities` • `GET /api/faculties` • `GET /api/departments`  
`GET /api/courses` • `GET /api/schedules` • `GET /api/semesters`  
`GET /api/roles` • `GET /api/buildings`

---

## 🔐 Security Checklist

+ ✅ Helmet.js (security headers)
+ ✅ CORS configured
+ ✅ Password hashing (bcrypt)
+ ✅ JWT tokens (jsonwebtoken)
+ ✅ Input validation (Joi)
+ ✅ Rate limiting (ready)
+ ✅ SQL injection prevention (parameterized queries)
+ ✅ Data encryption (ready)

---

## 📝 File Organization

```bash
unione_backend/
├── app/
│   ├── Http/          → Controllers
│   ├── Models/        → Database models
│   ├── Services/      → Business logic
│   ├── Jobs/          → Async jobs
│   ├── Mail/          → Email classes
│   ├── Notifications/ → Notification handlers
│   └── Observers/     → Event listeners
├── routes/
│   ├── api.php        → API routes
│   ├── web.php        → Web routes
│   └── console.php    → CLI commands
├── database/
│   ├── migrations/    → Database changes
│   ├── seeders/       → Seed data
│   └── factories/     → Test data generators
├── config/
│   ├── auth.php       → Auth config
│   ├── database.php   → DB config
│   └── services.php   → Service credentials
├── resources/
│   └── views/         → Email templates
└── tests/
    ├── Unit/          → Unit tests
    └── Feature/       → Integration tests

unione_frontend/
├── src/
│   ├── components/    → React components
│   ├── pages/         → Page components
│   ├── services/      → API services
│   ├── store/         → Redux slices
│   ├── hooks/         → Custom hooks
│   ├── utils/         → Helper functions
│   ├── types/         → TypeScript types
│   ├── styles/        → Tailwind setup
│   └── App.tsx        → Main app component
└── public/            → Static assets
```

---

## 🎨 React Component Categories

### Auth Components

LoginForm, SignupForm, ForgotPassword, ResetPassword, PrivateRoute, ProfileSettings

### Student Components

CourseList, Schedule, GradeView, EnrollmentForm, TranscriptView, AttendanceRecord

### Professor Components

CourseManagement, GradeEntry, AttendanceMarking, StudentList, AnnouncementBoard

### Admin Components

UserManagement, Analytics, SystemSettings, ReportGeneration, AuditLog

### Shared Components

Header, Sidebar, Footer, Modal, Form, Button, Card, Table, Pagination

### Page Components

DashboardPage, CoursesPage, SchedulePage, GradesPage, ProfilePage, SettingsPage

---

## 🧪 Testing Quick Start

### Backend Testing

```bash
npm test                            # Run all tests
npm run test:unit                   # Unit tests only
npm run test:integration            # Integration tests
npm run test:coverage               # Coverage report
```

### Frontend Testing

```bash
npm run test                        # Jest
npm run test:watch                  # Watch mode
npm run test:coverage               # Coverage
npm run test:e2e                    # E2E with Cypress
```

---

## 🔗 Database Connection

```bash
Host:     localhost
Port:     5432
Database: unione_db
User:     unione
Password: 241996
Pool:     Min 2, Max 20
```

### Connection String

```bash
postgresql://unione:241996@localhost:5432/unione_db
```

### Test Connection

```bash
psql postgresql://unione:241996@localhost:5432/unione_db -c "SELECT 1"
```

---

## 📚 Key User Roles

| Role | Permissions | Portal | Default Actions |
| ------ | ------------- | -------- | ----------------- |
| **Admin** | All system access | Admin Portal | Manage users, view analytics |
| **Faculty Dean** | Faculty management | Admin Portal | Approve courses, manage faculty |
| **Department Head** | Department management | Manager Portal | Manage departments, courses |
| **Professor** | Course management | Professor Portal | Post grades, take attendance |
| **Student** | Course enrollment | Student Portal | Enroll, view grades, schedule |
| **Guest** | View-only access | Public Portal | Browse course catalog |

---

## 🎯 Development Workflow

### 1. Using GitKraken (Recommended)

```bash
# Start work on issue
gitlens start work <issue-url>

# Create commits
gitlens commit composer

# Review PR
gitlens start review <pr-url>

# Push changes
git push
```

### 2. Manual Git Commands

```bash
git checkout -b feature/your-feature
# ... make changes ...
git add .
git commit -m "feat: description"
git push origin feature/your-feature
# Create PR on GitHub
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module 'dotenv'"

**Solution**: Run `npm install` in backend folder

### Issue: "Database connection refused"

**Solution**: Check PostgreSQL is running, verify connection string in .env

### Issue: "Port 3000 already in use"

**Solution**: Kill process: `lsof -ti:3000 | xargs kill -9`

### Issue: "JWT token invalid"

**Solution**: Ensure token is passed in header: `Authorization: Bearer <token>`

### Issue: "CORS errors in frontend"

**Solution**: Check CORS config in backend, verify frontend URL is allowed

---

## 📊 Current Status

```bash
✅ Backend Infrastructure    → Dependencies installed, server tested
✅ Documentation             → 8 documents, 3,280+ lines
✅ Database Schema           → 34 tables designed
✅ API Specification         → 52+ endpoints documented
✅ React Architecture        → 120+ components planned
⏳ Phase 1 Implementation    → Ready to start
⏳ Phase 2-8 Features        → Queued
```

---

## 🔗 Documentation Links

| Document | Purpose | Best For |
| ---------- | --------- | ---------- |
| [README.md](README.md) | Quick start | Setup |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Project summary | Overview |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Technical roadmap | Planning |
| [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) | React patterns | Frontend dev |
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | API reference | API integration |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | DB reference | Database work |
| [FEATURES_REFERENCE.md](FEATURES_REFERENCE.md) | Feature matrix | Requirements |
| [DEPENDENCIES_SETUP.md](DEPENDENCIES_SETUP.md) | Installation info | Setup help |

---

## 💡 Pro Tips

1. **Use TypeScript** - Better type safety and IDE support
2. **Keep API responses consistent** - See `src/utils/response.js` for format
3. **Always use migrations** - Never alter database manually
4. **Test as you code** - Write tests alongside features
5. **Document decisions** - Update docs when architecture changes
6. **Use Tailwind utilities** - Don't write custom CSS
7. **Commit frequently** - Small commits are easier to review
8. **Follow existing patterns** - See examples in `FRONTEND_GUIDE.md`

---

## 📞 Quick Help

### "How do I...?"

**...start a feature?**
→ Read IMPLEMENTATION_PLAN.md Phase 1 section → See FRONTEND_GUIDE.md/DATABASE_SCHEMA.md → Create branch

**...connect to database?**
→ Check .env file → Run migrations → See DATABASE_SCHEMA.md for tables

**...make an API call from React?**
→ See FRONTEND_GUIDE.md API Service Pattern section

**...add database columns?**
→ Create migration with `npx knex migrate:make` → See DATABASE_SCHEMA.md for structure

**...test my code?**
→ See IMPLEMENTATION_PLAN.md Testing Strategies section

**...deploy to production?**
→ See PROJECT_OVERVIEW.md Deployment section

---

## 🎖️ Remember

> Your work builds on solid foundations:
>
> + ✅ Architecture planned
> + ✅ Database designed  
> + ✅ API documented
> + ✅ Components specified
> + ✅ Timeline created
> + ✅ Examples provided
>
> **Focus on quality, not speed. Follow patterns. Ask questions. Help others.**

---

**Last Updated**: March 30, 2026  
**Version**: 1.0 Planning Complete  
**Ready to Code**: YES ✅

Print this card. Bookmark these docs. **Let's build something great!** 🚀

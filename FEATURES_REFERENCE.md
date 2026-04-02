# UniOne Backend Features - Quick Reference

## 📊 System Statistics

- **27 Core Database Models**
- **52 Total Database Tables** (including system tables)
- **50+ API Endpoints**
- **6 Role Types** with hierarchical scoping
- **10 Major Feature Categories**

---

## 🏛️ ORGANIZATIONAL HIERARCHY

```bash
University (1)
├── Faculty (N)
│   └── Department (N)
│       ├── Professors
│       ├── Employees
│       ├── Students
│       └── Courses
└── Roles & Permissions
```

---

## 👥 USER ROLES & CAPABILITIES

| Role | Access Level | Capabilities |
| ------ | -------------- | -------------- |
| **Admin** | System-wide | Manage all users, roles, system settings, webhooks |
| **Faculty Admin** | Faculty-wide | Manage faculty data, departments, faculty staff |
| **Department Admin** | Department | Manage department courses, sections, students |
| **Professor** | Course/Section | Grade students, manage attendance, announcements |
| **Student** | Personal | Enroll courses, view grades, check attendance |
| **Employee** | Department | Administrative support functions |

---

## 📚 ACADEMIC DATA MODELS (27 Total)

### Core User Models (3)

- User, Role, RoleUser

### Organizational Models (4)

- University, Faculty, Department, Employee

### Student Models (4)

- Student, StudentDepartmentHistory, StudentTermGpa, EnrollmentWaitlist

### Course Models (3)

- Course, Section, AcademicTerm

### Academic Performance (3)

- Enrollment, Grade, CourseRating

### Communication Models (3)

- Announcement, AnnouncementRead, SectionAnnouncement

### Attendance Models (2)

- AttendanceSession, AttendanceRecord

### System Models (3)

- AuditLog, Webhook, WebhookDelivery

### Specialized Models (1)

- Professor, UniversityVicePresident

---

## 🔗 KEY RELATIONSHIPS

```bash
User
├── HasMany: Roles (through RoleUser)
├── HasOne: Student (if student)
├── HasOne: Professor (if professor)
├── HasOne: Employee (if employee)
├── HasMany: Announcements (created)
├── HasMany: AuditLogs (performed)
└── HasMany: Webhooks (owns)

Student
├── BelongsTo: User
├── BelongsTo: Faculty
├── BelongsTo: Department
├── HasMany: Enrollments
├── HasMany: AttendanceRecords
├── HasMany: Grades (through enrollments)
└── HasMany: TermGPAs

Enrollment
├── BelongsTo: Student
├── BelongsTo: Section
├── BelongsTo: AcademicTerm
├── HasOne: Grade
└── HasOne: CourseRating

Section
├── BelongsTo: Course
├── BelongsTo: Professor
├── BelongsTo: AcademicTerm
├── HasMany: Enrollments
├── HasMany: AttendanceSessions
└── HasMany: Announcements
```

---

## 🔐 AUTHENTICATION FLOW

```bash
1. POST /auth/login (email, password)
2. Return JWT token + user object
3. All subsequent requests include: Authorization: Bearer <token>
4. Token middleware validates & attaches user to request
5. Role middleware checks access permissions
6. Scope middleware verifies organizational hierarchy
```

**Token Management:**

- Create token on login
- Revoke single token via DELETE
- Logout revokes current token
- Multiple active tokens allowed (device management)

---

## 📋 FEATURE MATRIX

### Authentication & Security (5 features)

- ✅ Email/password login
- ✅ JWT token management
- ✅ Role-based access control (RBAC)
- ✅ Password reset & change
- ✅ Audit logging

### Student Features (8 features)

- ✅ Course enrollment/drop
- ✅ Grade tracking
- ✅ Transcript viewing
- ✅ Attendance record tracking
- ✅ Course ratings
- ✅ Schedule view (list + iCal export)
- ✅ Waitlist management
- ✅ Academic history

### Professor Features (5 features)

- ✅ Section assignment
- ✅ Student grading
- ✅ Attendance management
- ✅ Section announcements
- ✅ Class schedule

### Academic Management (6 features)

- ✅ GPA calculation (term-based)
- ✅ Academic standing
- ✅ Prerequisites validation
- ✅ Course/section management
- ✅ Academic term lifecycle
- ✅ Department transfer tracking

### Communication (3 features)

- ✅ University announcements
- ✅ Real-time notifications
- ✅ Section announcements

### Integrations (2 features)

- ✅ Webhook system (event-driven)
- ✅ External system hooks

### Specialization (2 features)

- ✅ PDF transcript generation
- ✅ Multi-language support (en/ar)

---

## 📊 DATA TYPES & ENUMS

### Status Fields

- **Enrollment Status**: `active`, `completed`, `dropped`
- **Attendance Status**: `present`, `absent`, `late`
- **Academic Standing**: `good`, `probation`, `suspension`
- **Grade Status**: `complete`, `incomplete`

### Academic Fields

- GPA: Decimal (0.00 - 4.00)
- Points: Integer (0-100)
- Credit Hours: Integer
- Semester: 1-2 (or spring/fall)

### Timestamps

- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp
- Custom timestamps for business events

---

## 🚀 SCALABILITY FEATURES

### Multi-Tenancy

- Multiple universities in one system
- Faculty-level scoping
- Department-level scoping
- Role hierarchies prevent unauthorized access

### Performance Optimization

- Connection pooling for database
- Query eager loading (avoid N+1 queries)
- Pagination for large datasets
- Caching layer for frequently accessed data

### Reliability

- Soft deletes for data recovery
- Complete audit trail
- Webhook retry logic
- Transaction support for critical operations

---

## 🔄 API ENDPOINT ORGANIZATION

```bash
PUBLIC (Rate Limited)
├── POST /auth/login
├── POST /auth/forgot-password
└── POST /auth/reset-password

PROTECTED (All authenticated users)
├── POST /auth/logout
├── GET  /auth/me
├── GET  /announcements
├── GET  /notifications

STUDENT ONLY
├── GET  /student/profile
├── GET  /student/enrollments
├── POST /student/enrollments
├── GET  /student/grades
└── ... (7 more)

PROFESSOR ONLY
├── GET  /professor/profile
├── GET  /professor/sections
├── POST /professor/sections/{id}/grades
└── ... (7 more)

ADMIN ONLY
├── GET  /admin/webhooks
├── POST /admin/webhooks
└── ... (3 more)
```

### **Total Endpoints: 52+**

---

## 🗃️ DATABASE SCHEMA HIGHLIGHTS

### Smart Defaults

- Courses default to active
- Sections created in current term
- Students enrolled at signup

### Validations

- Email uniqueness
- National ID uniqueness
- GPA bounds (0-4)
- Date constraints (birth date < today)

### Foreignings

- Cascading deletes for related records
- Referential integrity enforcement
- Foreign key constraints enabled

### Indexing

- Primary keys on all tables
- Unique indexes on key fields
- Foreign key indexes for performance

---

## 📱 Special Outputs

### iCalendar (.ics)

- Standard format for calendar imports
- Suitable for Google Calendar, Outlook, Apple Calendar
- Includes course code, professor name, time, location
- Recurring events for semester-long courses

### PDF Transcript

- Academic history summarization
- Semester-by-semester breakdown
- GPA calculations
- Professional formatting

### JSON Responses

- Consistent error format
- Pagination metadata
- Relationship nesting options
- Filtering & sorting parameters

---

## 🔧 TECHNOLOGY STACK

**Backend**: Node.js + Express.js
**Database**: PostgreSQL 12+
**Authentication**: JWT (jsonwebtoken)
**Validation**: Joi
**Password Hashing**: bcryptjs
**Environment**: dotenv
**Security**: Helmet, CORS
**Logging**: Morgan
**Testing**: Jest + Supertest
**Documentation**: Swagger/OpenAPI

---

## 📈 Implementation Priority

### Phase 1 (High Priority)

- User authentication
- Course & enrollment
- Grading system
- Student portal basics

### Phase 2 (Medium Priority)

- Professor portal
- Attendance tracking
- Announcements
- Academic calculations

### Phase 3 (Lower Priority)

- Webhooks
- Advanced reporting
- Multi-language
- Admin features

---

## ✨ Unique Features

- Automatic waitlist priority scoring
- GPA curve application
- Academic standing automation
- Soft delete recovery
- Complete audit trail
- Webhook delivery retry logic
- Multi-language course catalogs
- Department transfer tracking
- Term-based GPA separation

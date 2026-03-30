# UniOne Backend - Implementation Plan for Node.js Clone

## Project Overview
A comprehensive academic management system for universities with role-based access, course management, student enrollment, grading, attendance tracking, and webhook support.

---

## DATABASE MODELS & RELATIONSHIPS

### 1. **User Core Models**
- **User** (Base authentication model)
  - Fields: national_id, first_name, last_name, email, password, phone, gender, date_of_birth, avatar_path, is_active, must_change_password
  - Relations: HasMany roles (RoleUser), HasOne Profile (Student/Professor/Employee)
  - Timestamps: created_at, updated_at, deleted_at (soft delete)

- **Role** (Admin, Faculty Admin, Department Admin, Professor, Student, Employee)
  - Fields: name, slug, permissions (JSON)
  - Pivot: RoleUser (user_id, role_id, scope - university_id/faculty_id/department_id)

- **University**
  - Fields: name, code, country, city, established_year, logo_path, contact_* (phone, email, website, address)
  - Relations: HasMany faculties, HasMany departments, HasMany users (through roles)

### 2. **Organizational Structure**
- **Faculty**
  - Fields: name, name_ar, code, university_id, logo_path
  - Relations: HasMany departments, HasMany students, HasMany professors

- **Department**
  - Fields: name, name_ar, code, faculty_id, scope, is_mandatory, required_credit_hours, logo_path
  - Relations: BelongsTo faculty, HasMany students, HasMany professors, HasMany courses (pivot: department_course)

- **Employee**
  - Fields: user_id, staff_number, department_id, position, hired_at
  - Relations: BelongsTo user, BelongsTo department

- **UniversityVicePresident**
  - Fields: user_id, university_id, department, appointed_at
  - Relations: BelongsTo user, BelongsTo university

### 3. **Academic Models**
- **Course**
  - Fields: code, name, name_ar, description, credit_hours, lecture_hours, lab_hours, level, is_elective, is_active
  - Relations: BelongsToMany departments, BelongsToMany prerequisites (self-referential), HasMany sections

- **Section**
  - Fields: course_id, professor_id, academic_term_id, semester, capacity, schedule (JSON)
  - Relations: BelongsTo course, BelongsTo professor, BelongsTo academicTerm, HasMany enrollments, HasMany announcements

- **AcademicTerm**
  - Fields: name, start_date, end_date, registration_start, registration_end, is_active
  - Relations: HasMany sections, HasMany enrollments

- **Enrollment**
  - Fields: student_id, section_id, academic_term_id, status, registered_at, dropped_at
  - Relations: BelongsTo student, BelongsTo section, BelongsTo academicTerm, HasOne grade, HasOne rating

- **EnrollmentWaitlist**
  - Fields: student_id, section_id, academic_term_id, position, priority_score, requested_at
  - Relations: BelongsTo student, BelongsTo section

- **Student**
  - Fields: user_id, student_number, faculty_id, department_id, academic_year, semester, enrollment_status, gpa, academic_standing, enrolled_at, graduated_at
  - Relations: BelongsTo user, BelongsTo faculty, BelongsTo department, HasMany enrollments, HasMany departmentHistory, HasMany termGpas, HasMany attendanceRecords

- **StudentTermGpa**
  - Fields: student_id, academic_term_id, gpa, credit_hours_completed
  - Relations: BelongsTo student, BelongsTo academicTerm

- **StudentDepartmentHistory**
  - Fields: student_id, department_id, academic_year, semester, reason
  - Relations: BelongsTo student, BelongsTo department

### 4. **Grading & Performance**
- **Grade**
  - Fields: enrollment_id, points, letter_grade, status (complete/incomplete)
  - Relations: BelongsTo enrollment

- **CourseRating**
  - Fields: enrollment_id, rating (1-5), feedback, submitted_at
  - Relations: BelongsTo enrollment

### 5. **Attendance**
- **AttendanceSession**
  - Fields: section_id, date, session_number, status
  - Relations: BelongsTo section, HasMany attendanceRecords

- **AttendanceRecord**
  - Fields: attendance_session_id, student_id, status (present/absent/late), note
  - Relations: BelongsTo attendanceSession, BelongsTo student

### 6. **Communication**
- **Announcement** (university-wide)
  - Fields: user_id, title, content, published_at, is_published
  - Relations: HasMany reads (AnnouncementRead), BelongsTo user

- **AnnouncementRead**
  - Fields: user_id, announcement_id, read_at
  - Track announcement engagement

- **SectionAnnouncement** (course-specific)
  - Fields: section_id, user_id (professor), title, content, published_at
  - Relations: BelongsTo section, BelongsTo user

### 7. **Notifications**
- **Notification** (Laravel notifications table)
  - Fields: notifiable_type, notifiable_id, type, data, read_at, created_at
  - System notifications for enrollments, grades, announcements, etc.

### 8. **System Features**
- **AuditLog**
  - Fields: user_id, action, auditable_type, auditable_id, description, old_values (JSON), new_values (JSON), ip_address, created_at
  - Complete audit trail of all system changes

- **Webhook**
  - Fields: user_id, url, secret, events (JSON array), is_active, failure_count, last_triggered_at
  - Relations: HasMany deliveries

- **WebhookDelivery**
  - Fields: webhook_id, event, payload (JSON), status, response, attempt_count, next_retry_at
  - Relations: BelongsTo webhook

---

## API ENDPOINTS STRUCTURE

### Authentication Routes (Public + Rate Limited)
```
POST   /api/auth/login                    - Login with email/password
POST   /api/auth/forgot-password          - Request password reset
POST   /api/auth/reset-password           - Reset password with token
```

### Authentication Routes (Protected)
```
POST   /api/auth/logout                   - Logout user
GET    /api/auth/me                       - Get current user profile
POST   /api/auth/change-password          - Change password
PATCH  /api/auth/profile                  - Update profile (phone, dob, avatar)
GET    /api/auth/tokens                   - List active tokens
DELETE /api/auth/tokens                   - Revoke all tokens
DELETE /api/auth/tokens/{tokenId}         - Revoke specific token
```

### Announcements Routes (Protected)
```
GET    /api/announcements                 - Get all announcements
POST   /api/announcements/{id}/read       - Mark announcement as read
```

### Notifications Routes (Protected)
```
GET    /api/notifications                 - Get user notifications
POST   /api/notifications/read-all        - Mark all as read
POST   /api/notifications/{id}/read       - Mark single as read
DELETE /api/notifications/{id}            - Delete notification
```

### Student Portal Routes (Protected - Student Role)
```
GET    /api/student/profile               - Get student profile
GET    /api/student/enrollments           - List enrolled courses
POST   /api/student/enrollments           - Enroll in course
DELETE /api/student/enrollments/{id}      - Drop course
GET    /api/student/grades                - Get all grades
GET    /api/student/transcript            - Get academic transcript
GET    /api/student/transcript/pdf        - Download transcript as PDF
GET    /api/student/academic-history      - Get academic history
GET    /api/student/schedule              - Get class schedule
GET    /api/student/schedule/ics          - Download schedule as iCal
GET    /api/student/attendance            - Get attendance records
GET    /api/student/sections/{id}/announcements  - Get section announcements
GET    /api/student/ratings               - Get course ratings submitted
POST   /api/student/ratings               - Submit course rating
GET    /api/student/waitlist              - Get waitlist entries
DELETE /api/student/waitlist/{sectionId}  - Remove from waitlist
```

### Professor Portal Routes (Protected - Professor Role)
```
GET    /api/professor/profile             - Get professor profile
GET    /api/professor/sections            - List taught sections
GET    /api/professor/schedule            - Get teaching schedule
GET    /api/professor/sections/{id}/students         - Get section students
GET    /api/professor/sections/{id}/grades           - Get all grades
POST   /api/professor/sections/{id}/grades           - Submit grades
GET    /api/professor/sections/{id}/attendance       - Get attendance sessions
POST   /api/professor/sections/{id}/attendance       - Create attendance session
GET    /api/professor/sections/{id}/attendance/{sessionId}    - Get session details
PUT    /api/professor/sections/{id}/attendance/{sessionId}    - Update attendance records
GET    /api/professor/sections/{id}/announcements    - Get section announcements
POST   /api/professor/sections/{id}/announcements    - Create announcement
DELETE /api/professor/sections/{id}/announcements/{id} - Delete announcement
```

### Admin Routes (Protected - Admin/Faculty Admin/Department Admin Roles)
```
GET    /api/admin/webhooks                - List webhooks
POST   /api/admin/webhooks                - Create webhook
PATCH  /api/admin/webhooks/{id}           - Update webhook
DELETE /api/admin/webhooks/{id}           - Delete webhook
GET    /api/admin/webhooks/{id}/deliveries - Get webhook delivery history
```

---

## FEATURES BREAKDOWN

### 1. **Authentication & Authorization**
- ✅ Email/Password login with rate limiting
- ✅ JWT tokens (Sanctum equivalent) for stateless API
- ✅ Role-Based Access Control (RBAC) with 6 roles
- ✅ Scoped roles (University/Faculty/Department level)
- ✅ Password reset flow (forgot password + reset link)
- ✅ Force password change on first login
- ✅ Token management (revoke all, revoke single)
- ✅ Soft deletes for users

### 2. **Student Portal**
- ✅ View personal profile and grades
- ✅ Enroll/Drop courses (with waitlist)
- ✅ View academic transcript (with PDF export)
- ✅ Academic history and GPA tracking
- ✅ Class schedule visualization
- ✅ iCal export for calendar integration
- ✅ Attendance tracking
- ✅ Submit course ratings/feedback
- ✅ Waitlist management (automatic priority scoring)
- ✅ View section-specific announcements

### 3. **Professor Portal**
- ✅ View teaching assignment
- ✅ Manage student enrollments in sections
- ✅ Submit and view grades
- ✅ Track student attendance
- ✅ Create attendance sessions
- ✅ Create/manage section announcements
- ✅ View class schedule

### 4. **Course Management**
- ✅ Course catalog with prerequisites
- ✅ Multiple sections per course
- ✅ Section capacity management
- ✅ Multi-language support (English/Arabic)
- ✅ Elective course tracking
- ✅ Course rating by students

### 5. **Academic Management**
- ✅ Academic terms management
- ✅ Student GPA calculation (term-based)
- ✅ Academic standing tracking
- ✅ Student department transfer history
- ✅ Student academic year/semester tracking
- ✅ Grade letter assignment based on points
- ✅ Course prerequisites validation

### 6. **Organizational Structure**
- ✅ Multi-university support
- ✅ Faculty structure under universities
- ✅ Departments under faculties
- ✅ Scope-based permissions (university/faculty/department level)
- ✅ Employee management

### 7. **Communication**
- ✅ University-wide announcements
- ✅ Section-specific announcements
- ✅ Real-time notifications
- ✅ Mark announcements as read
- ✅ Notification management (list, read, delete)

### 8. **Audit & Security**
- ✅ Complete audit logging of all changes
- ✅ IP address tracking
- ✅ Before/after value tracking
- ✅ Soft deletes with recovery capability
- ✅ Rate limiting on sensitive endpoints

### 9. **Webhooks & Integrations**
- ✅ Webhooks for external system integration
- ✅ Event-based triggers
- ✅ Webhook secret for authentication
- ✅ Delivery history and retry logic
- ✅ Failure tracking and notifications

### 10. **Advanced Features**
- ✅ iCalendar (.ics) export
- ✅ PDF transcript generation
- ✅ Batch grade submission
- ✅ Automatic waitlist to enrollment transition
- ✅ GPA service for calculations
- ✅ Multi-language support (i18n)

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [ ] Database schema creation (all migrations)
- [ ] User & authentication models
- [ ] Auth middleware & token management
- [ ] Basic CRUD for core models
- [ ] Docker setup for dev environment

### Phase 2: Student Portal (Week 2)
- [ ] Student model & relationships
- [ ] Course & Section models
- [ ] Enrollment system
- [ ] Grade management
- [ ] Student controller & routes

### Phase 3: Professor Portal (Week 3)
- [ ] Professor model & relationships
- [ ] Grade submission
- [ ] Attendance management
- [ ] Section announcements
- [ ] Professor controller & routes

### Phase 4: Academic Features (Week 4)
- [ ] Academic terms
- [ ] GPA calculation service
- [ ] Academic standing logic
- [ ] Transcript generation (PDF)
- [ ] Schedule/iCal export

### Phase 5: Communication & Notifications (Week 5)
- [ ] Announcements system
- [ ] Real-time notifications
- [ ] Email notifications templating
- [ ] Notification controller & routes

### Phase 6: Advanced Features (Week 6)
- [ ] Audit logging
- [ ] Webhook system
- [ ] Waitlist management
- [ ] Course ratings
- [ ] Admin webhooks management

### Phase 7: Admin & Management (Week 7)
- [ ] Admin dashboard
- [ ] User management
- [ ] Role scoping
- [ ] Organization structure management
- [ ] Admin controller & routes

### Phase 8: Testing & Optimization (Week 8)
- [ ] Unit tests for all models
- [ ] Integration tests for endpoints
- [ ] Performance optimization
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment preparation

---

## KEY CONSIDERATIONS FOR NODE.JS MIGRATION

### Database Layer
- Use Knex.js for query builder and migrations
- PostgreSQL connection pooling with `pg` package
- Use same database (unione_db) for seamless transition

### Authentication
- Replace Laravel Sanctum with JWT tokens (jsonwebtoken package)
- Implement refresh token mechanism
- Use bcryptjs for password hashing
- Implement rate limiting (express-rate-limit)

### Middleware Stack
- Express middleware for auth, validation, error handling
- Custom middleware for role-based access
- Error handling centralization
- Request logging (morgan)

### Validation
- Joi for schema validation
- Custom validation rules
- Consistent error response format

### File Handling
- Support avatar uploads (multer)
- PDF generation (pdfkit or puppeteer)
- iCal generation (ical.js or similar)
- File storage in local filesystem or cloud

### Notifications
- Email service (nodemailer)
- Queue system for async jobs (bull/bullmq)
- Event emitter pattern

### Performance
- Database connection pooling
- Query optimization with eager loading
- Caching layer (Redis)
- Pagination for large datasets

---

## REPOSITORY STRUCTURE FOR NODE.JS

```
unione_node/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── knex.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── roleAuth.js
│   │   ├── validation.js
│   │   └── rateLimit.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Professor.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── Grade.js
│   │   └── ... (other models)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── student.js
│   │   ├── professor.js
│   │   ├── announcements.js
│   │   ├── notifications.js
│   │   ├── admin.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── StudentController.js
│   │   ├── ProfessorController.js
│   │   ├── AnnouncementController.js
│   │   └── ... (other controllers)
│   ├── services/
│   │   ├── GpaService.js
│   │   ├── AuthService.js
│   │   ├── EnrollmentService.js
│   │   ├── AttendanceService.js
│   │   ├── EmailService.js
│   │   └── ... (other services)
│   ├── utils/
│   │   ├── response.js
│   │   ├── validator.js
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── logger.js
│   │   └── dateUtils.js
│   ├── validators/
│   │   ├── authSchemas.js
│   │   ├── studentSchemas.js
│   │   ├── enrollmentSchemas.js
│   │   └── ... (other schemas)
│   ├── jobs/
│   │   ├── SendEmailJob.js
│   │   ├── GenerateTranscriptJob.js
│   │   └── ... (other jobs)
│   └── server.js
├── migrations/
│   ├── 2025_01_01_create_tables.js
│   └── ... (other migrations)
├── seeds/
│   ├── RolesSeeder.js
│   └── ... (other seeders)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── docker-compose.yml
```

---

## DATABASE MIGRATION COUNT
**Total Migrations: 52**
- Core tables: Users, Roles, University structure (6)
- Academic structure: Courses, Sections, Enrollments (8)
- Grading & Performance: Grades, CourseRatings, StudentGPA (3)
- Attendance: Sessions, Records (2)
- Communication: Announcements, Notifications (3)
- System: AuditLog, Webhooks (3)
- Additional: Cache, Jobs, Stateful features (28)

---

## ESTIMATED EFFORT
- Database Setup: 2-3 days
- API Implementation: 2-3 weeks
- Testing & Refinement: 1 week
- Documentation & Deployment: 3-5 days
- **Total: 4-5 weeks**

---

## Success Criteria
✅ All 52 tables created and migrated
✅ All API endpoints functional
✅ Role-based access working correctly
✅ Student/Professor portals fully operational
✅ GPA calculations accurate
✅ Notification system active
✅ Audit logging comprehensive
✅ 80%+ code coverage in tests
✅ API response times < 500ms
✅ Full parity with Laravel backend

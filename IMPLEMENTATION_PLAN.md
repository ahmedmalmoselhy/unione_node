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

---

# FRONTEND/UI IMPLEMENTATION PLAN

## Technology Stack for Frontend

### Recommended Stack
- **Framework**: React 18+ (JavaScript/TypeScript)
- **State Management**: Redux Toolkit or TanStack Query
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts/Analytics**: Recharts or Chart.js
- **Calendar**: React Calendar or FullCalendar
- **PDF Export**: jsPDF + html2canvas
- **Notifications**: Sonner or React Hot Toast
- **Testing**: Jest + React Testing Library
- **Build Tool**: Vite (faster than Create React App)
- **Type Safety**: TypeScript

### Alternative Options
- **Vue.js 3** - More approachable learning curve, excellent ecosystem
- **Next.js** - Full-stack React with SSR/SSG capabilities
- **Angular** - Enterprise-grade, if organization prefers

---

## Frontend Project Structure

```
unione_frontend/
├── public/
│   ├── icons/
│   ├── logo.png
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── PasswordReset.tsx
│   │   │   └── ProfileUpdate.tsx
│   │   ├── Common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── NotFound.tsx
│   │   ├── Student/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Enrollments.tsx
│   │   │   ├── Grades.tsx
│   │   │   ├── Transcript.tsx
│   │   │   ├── Schedule.tsx
│   │   │   ├── Attendance.tsx
│   │   │   ├── Ratings.tsx
│   │   │   └── Waitlist.tsx
│   │   ├── Professor/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Sections.tsx
│   │   │   ├── GradeSubmission.tsx
│   │   │   ├── AttendanceTracker.tsx
│   │   │   ├── Announcements.tsx
│   │   │   └── StudentList.tsx
│   │   ├── Admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── RoleManagement.tsx
│   │   │   ├── WebhookManagement.tsx
│   │   │   └── AuditLogs.tsx
│   │   └── Shared/
│   │       ├── Announcements.tsx
│   │       ├── Notifications.tsx
│   │       └── NotificationCenter.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── StudentPortalPage.tsx
│   │   ├── ProfessorPortalPage.tsx
│   │   ├── AdminPortalPage.tsx
│   │   └── UnauthorizedPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useStudent.ts
│   │   ├── useProfessor.ts
│   │   ├── useNotifications.ts
│   │   └── useFetch.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── UserContext.tsx
│   │   └── NotificationContext.tsx
│   ├── store/ (Redux Toolkit)
│   │   ├── authSlice.ts
│   │   ├── studentSlice.ts
│   │   ├── notificationSlice.ts
│   │   └── store.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── studentService.ts
│   │   ├── professorService.ts
│   │   ├── adminService.ts
│   │   └── notificationService.ts
│   ├── utils/
│   │   ├── axios.ts (configured instance)
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── forms.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tailwind.css
│   │   └── variables.css
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env
├── .gitignore
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## UI COMPONENTS BREAKDOWN

### Authentication Pages (Week 1)
- **Login Form**
  - Email/Password input
  - Forgot password link
  - "Remember me" checkbox
  - Error handling & validation
  - Loading state

- **Password Reset Flow**
  - Email verification
  - Reset link validation
  - New password form
  - Confirmation message

- **Profile Update Modal**
  - Phone number update
  - Date of birth picker
  - Avatar upload
  - Save/Cancel buttons

### Student Portal Dashboard (Week 2)
- **Navigation/Sidebar**
  - Role-based menu items
  - Active course count badge
  - GPA display
  - Logout button

- **Dashboard Cards**
  - Current GPA (large display)
  - Semester/Year info
  - Enrolled course count
  - Grade summary
  - Upcoming classes

- **Quick Actions**
  - Enroll in course
  - View grades
  - Check attendance
  - Submit ratings
  - View schedule

### Enrollment Management (Week 2)
- **Course Catalog View**
  - Search & filter courses
  - Course cards (code, name, credits, professor)
  - Prerequisites info
  - Section capacity indicator
  - Enroll button
  - Waitlist option

- **My Enrollments View**
  - Table of enrolled courses
  - Section info (professor, time, location)
  - Current grade (if available)
  - Drop option (with deadline warning)
  - Sort & filter options

- **Waitlist Management**
  - Waitlist status table
  - Position in queue
  - Remove from waitlist button
  - Notifications when moved to enrollment

### Academic Records (Week 3)
- **Grades Dashboard**
  - Course list with grades
  - Letter grade display
  - Points breakdown
  - GPA calculation
  - Semester filter

- **Transcript View**
  - Academic history table (by semester)
  - Term GPA display
  - Cumulative GPA
  - Courses taken per term
  - PDF export button

- **Schedule View**
  - Calendar view of classes
  - List view option
  - Color-coded by course
  - Time and location info
  - iCal export button

### Attendance Tracking (Week 3)
- **Attendance Records**
  - Table of attendance sessions
  - Status indicators (present/absent/late)
  - Attendance percentage
  - Filter by section

### Course Ratings (Week 3)
- **Rating Form Modal**
  - Star rating (1-5 scale)
  - Feedback textarea
  - Submit button
  - Confirmation message

- **My Ratings List**
  - Courses rated
  - Rating submitted
  - Edit/Delete options

### Professor Portal Dashboard (Week 4)
- **Teaching Assignment Overview**
  - Sections taught (current term)
  - Enrollment count per section
  - Student list quick link
  - Grading status indicator

- **Section Manager**
  - List of taught sections
  - Course info
  - Section schedule
  - Student count
  - Action buttons (grade, attendance, announcements)

### Grade Management (Week 4)
- **Grade Input Form**
  - Bulk student list with input fields
  - Points/Letter grade display
  - Validation warnings
  - Save progress indicator
  - Submit button

- **Grade View**
  - Student list with grades
  - Filter & sort options
  - Edit individual grades
  - Search student

### Attendance Management (Week 4)
- **Attendance Session Creator**
  - Date picker
  - Session number input
  - Create button

- **Attendance Recorder**
  - List of enrolled students
  - Checkboxes for status (present/absent/late)
  - Note field per student
  - Save button
  - Attendance percentage summary

### Announcements (Week 5)
- **Announcement List**
  - University-wide announcements
  - Title and preview
  - Publication date
  - Unread indicator
  - Mark as read on click

- **Section Announcements** (Professor)
  - Create announcement form (professor only)
  - Title + content editor (rich text)
  - Publish button
  - List of posted announcements with delete option

### Notifications (Week 5)
- **Notification Center**
  - List of notifications (most recent first)
  - Notification types (icons)
  - Read/Unread status
  - Timestamp
  - Mark as read
  - Delete notification
  - Mark all as read button

- **Bell Icon with Badge**
  - Unread count
  - Click to open notification center

### Admin Portal (Week 6)
- **Admin Dashboard**
  - System statistics
  - Recent audit logs
  - Webhook delivery status
  - User management link

- **Webhook Management**
  - List webhooks
  - Create webhook form (URL, events, secret)
  - Edit/Delete actions
  - Delivery history view
  - Test webhook button

- **Audit Logs View**
  - Filterable log table
  - User, action, timestamp
  - Changes before/after view
  - IP address tracking

---

## UI PHASES & TIMELINE

### Phase 1: Core Authentication & Layout (Week 1)
- [x] Project setup (Vite + React)
- [ ] Login page
- [ ] Layout components (Header, Sidebar, Footer)
- [ ] Route protection (PrivateRoute, RoleRoute)
- [ ] Token storage & refresh

### Phase 2: Student Portal Core (Week 2)
- [ ] Dashboard
- [ ] Enrollments (view, search, filter)
- [ ] Course catalog
- [ ] My enrollments list
- [ ] Drop course functionality
- [ ] Waitlist management

### Phase 3: Student Academic Records (Week 3)
- [ ] Grades view
- [ ] Transcript (table + PDF export)
- [ ] Academic history
- [ ] Schedule (calendar + iCal export)
- [ ] Attendance records
- [ ] Course ratings form
- [ ] My ratings list

### Phase 4: Professor Portal (Week 4)
- [ ] Professor dashboard
- [ ] Sections overview
- [ ] Student list per section
- [ ] Bulk grade entry
- [ ] Attendance session creation
- [ ] Attendance recording
- [ ] Section announcements

### Phase 5: Communication & Shared Features (Week 5)
- [ ] Announcements list
- [ ] Notifications system
- [ ] Notification center/badge
- [ ] Mark read functionality
- [ ] Profile update modal

### Phase 6: Admin & Advanced Features (Week 6)
- [ ] Admin dashboard
- [ ] Webhook management UI
- [ ] Audit logs viewer
- [ ] User role management (advanced)

### Phase 7: Polish & Optimization (Week 7)
- [ ] Error boundaries
- [ ] Loading states (Skeleton loaders)
- [ ] Empty states
- [ ] Responsive design
- [ ] Accessibility (a11y)
- [ ] Performance optimization
- [ ] Dark mode (optional)

### Phase 8: Testing & Deployment (Week 8)
- [ ] Unit tests (components, hooks, utilities)
- [ ] Integration tests (page navigation, data flow)
- [ ] E2E tests (user workflows)
- [ ] API documentation
- [ ] Deployment setup (Docker, CI/CD)

---

## COMPONENT DEPENDENCIES & RELATIONSHIPS

```
App
├── AuthProvider
│   ├── Login Page
│   └── PrivateRoute
│       ├── StudentPortal
│       │   ├── StudentDashboard
│       │   │   ├── EnrollmentCard
│       │   │   ├── GradesCard
│       │   │   └── ScheduleCard
│       │   ├── EnrollmentsPage
│       │   │   ├── CourseCatalog
│       │   │   └── MyEnrollments
│       │   ├── AcademicRecordsPage
│       │   │   ├── GradesView
│       │   │   ├── TranscriptView
│       │   │   ├── ScheduleView
│       │   │   └── AttendanceView
│       │   ├── RatingsPage
│       │   └── WaitlistPage
│       ├── ProfessorPortal
│       │   ├── ProfessorDashboard
│       │   ├── SectionsPage
│       │   ├── GradeManagementPage
│       │   ├── AttendancePage
│       │   └── AnnouncementsPage
│       ├── AdminPortal
│       │   ├── AdminDashboard
│       │   ├── WebhookManagementPage
│       │   └── AuditLogsPage
│       ├── AnnouncementsPage
│       ├── NotificationCenter
│       └── ProfileUpdateModal
└── GlobalErrorBoundary
```

---

## API INTEGRATION POINTS

### Authentication Service
```typescript
- login(email, password) → token + user
- logout() → clear token
- refreshToken() → new token
- getProfile() → user data
- updateProfile(data) → updated user
- changePassword(old, new) → confirmation
```

### Student Service
```typescript
- getEnrollments() → enrolled courses
- enrollCourse(sectionId) → enrollment
- dropCourse(enrollmentId) → confirmation
- getGrades() → all grades
- getTranscript() → academic history
- getSchedule() → class schedule
- getAttendance() → attendance records
- submitRating(enrollmentId, rating) → confirmation
- getWaitlist() → waitlist entries
```

### Professor Service
```typescript
- getSections() → taught sections
- getSectionStudents(sectionId) → students
- submitGrades(sectionId, grades) → confirmation
- createAttendanceSession(sectionId) → session
- recordAttendance(sessionId, records) → confirmation
- createAnnouncement(sectionId, data) → announcement
- getAnnouncements(sectionId) → announcements
```

### Shared Services
```typescript
- getAnnouncements() → announcements
- markAnnouncementRead(id) → confirmation
- getNotifications() → notifications
- markNotificationRead(id) → confirmation
- deleteNotification(id) → confirmation
```

---

## DESIGN SYSTEM & STYLING

### Color Palette
```css
Primary:     #3B82F6 (Blue)
Secondary:   #8B5CF6 (Purple)
Success:     #10B981 (Green)
Warning:     #F59E0B (Amber)
Error:       #EF4444 (Red)
Neutral:     #6B7280 (Gray)
```

### Typography
```
Headings: Poppins or Inter (Sans-serif)
Body:     Poppins or Inter (Sans-serif)
Mono:     JetBrains Mono (Code)
```

### Responsive Breakpoints
```css
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px
```

### Component Library
- Use Shadcn/ui for pre-built components
- Customize with Tailwind CSS
- Consistent spacing (4px base unit)
- Accessible by default (WCAG 2.1 AA)

---

## STATE MANAGEMENT STRATEGY

### Redux Slices
- **authSlice**: user, token, isAuthenticated, loading
- **studentSlice**: enrollments, grades, transcript, schedule
- **notificationSlice**: notifications, unreadCount
- **loadingSlice**: global loading states
- **errorSlice**: error messages and alerts

### React Query (Alternative/Complement)
- Automatic caching of API responses
- Background refetching
- Optimistic updates
- Pagination support

---

## PERFORMANCE OPTIMIZATION

### Code Splitting
- Route-based code splitting (React.lazy)
- Component-level lazy loading
- Dynamic imports for heavy components

### Optimization Techniques
- Memoization (React.memo, useMemo, useCallback)
- Image optimization (lazy loading, compression)
- Bundle size analysis (webpack-bundle-analyzer)
- Caching strategy for API calls
- Service workers for offline support

### Core Web Vitals Targets
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

---

## ACCESSIBILITY REQUIREMENTS

### Features
- Semantic HTML (nav, main, section, article)
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast ratios (4.5:1 for normal text)
- Focus indicators visible
- Form validation messages associated with inputs

### Testing
- Axe DevTools for automated scanning
- Manual testing with screen readers (NVDA, JAWS)
- Keyboard-only navigation testing

---

## DEPLOYMENT STRATEGY

### Development
```bash
npm run dev
# Vite development server on http://localhost:5173
```

### Building
```bash
npm run build
# Optimized production bundle in /dist
```

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
CMD ["yarn", "preview"]
```

### Environment Variables
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=UniOne
VITE_LOG_LEVEL=debug
```

---

## TESTING STRATEGY

### Unit Tests (Components, Hooks, Utilities)
```
Frameworks: Jest + React Testing Library
Coverage Target: 80%+
```

### Integration Tests (Page Navigation, Data Flow)
```
Test User Workflows:
- Login → Student Dashboard → Enroll → View Grades
- Login → Professor → Grade Students
- Login → Admin → Manage Webhooks
```

### E2E Tests (Full User Scenarios)
```
Framework: Cypress or Playwright
Test Critical Paths:
- Complete enrollment workflow
- Grading system
- Attendance tracking
```

---

## ESTIMATED EFFORT (FRONTEND)

| Phase | Focus | Duration |
|-------|-------|----------|
| **1** | Auth, Layout | 5 days |
| **2** | Student Core | 4 days |
| **3** | Academic Records | 4 days |
| **4** | Professor Portal | 4 days |
| **5** | Communication | 3 days |
| **6** | Admin Features | 3 days |
| **7** | Polish & UX | 4 days |
| **8** | Testing & Deploy | 4 days |
| **TOTAL** | Full Frontend | **31 days (~5-6 weeks)** |

---

## FULL STACK TIMELINE

| Component | Duration | Total |
|-----------|----------|-------|
| Backend (Node.js) | 4-5 weeks | Week 1-5 |
| Frontend (React) | 5-6 weeks | Week 1-6 |
| **PARALLEL**: Both can be developed simultaneously after API contracts are defined | - | - |
| Integration & Docs | 1 week | Week 6-7 |
| **TOTAL PROJECT** | - | **7-8 weeks** |

---

## FRONTEND SUCCESS CRITERIA

✅ All 52 API endpoints consumed and integrated  
✅ Student portal fully functional (enrollments, grades, schedule)  
✅ Professor portal fully functional (grading, attendance)  
✅ Admin portal functional (webhooks, audit logs)  
✅ Real-time notifications working  
✅ PDF transcript generation  
✅ iCal schedule export  
✅ Role-based access enforcement  
✅ 80%+ test coverage  
✅ Responsive design (mobile, tablet, desktop)  
✅ Accessibility compliance (WCAG 2.1 AA)  
✅ Performance: LCP < 2.5s, FID < 100ms  
✅ 0 console errors in production build

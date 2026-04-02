# UniOne Database Schema Reference

---

## Table Structure Reference

### 1. universities

```sql
id (PK)
name (VARCHAR)
code (VARCHAR, UNIQUE)
country (VARCHAR)
city (VARCHAR)
established_year (INTEGER)
logo_path (VARCHAR, NULL)
president_id (FK→users, NULL)
phone (VARCHAR, NULL)
email (VARCHAR, NULL)
website (VARCHAR, NULL)
address (TEXT, NULL)
created_at, updated_at
```

### 2. roles

```sql
id (PK)
name (VARCHAR, UNIQUE)
slug (VARCHAR, UNIQUE)
permissions (JSONB)
created_at, updated_at
```

### 3. users

```sql
id (PK)
national_id (VARCHAR, UNIQUE)
first_name (VARCHAR)
last_name (VARCHAR)
email (VARCHAR, UNIQUE)
password (VARCHAR)
phone (VARCHAR, NULL)
gender (VARCHAR, NULL)
date_of_birth (DATE, NULL)
avatar_path (VARCHAR, NULL)
is_active (BOOLEAN, default: true)
must_change_password (BOOLEAN, default: false)
email_verified_at (TIMESTAMP, NULL)
created_at, updated_at, deleted_at
```

### 4. role_user (Pivot Table)

```sql
id (PK)
user_id (FK→users)
role_id (FK→roles)
scope (VARCHAR, NULL) - university_id, faculty_id, department_id, or NULL
scope_id (INTEGER, NULL) - the actual ID of the scope
created_at, updated_at
```

### 5. faculties

```sql
id (PK)
university_id (FK→universities)
name (VARCHAR)
name_ar (VARCHAR, NULL)
code (VARCHAR)
logo_path (VARCHAR, NULL)
created_at, updated_at
```

### 6. departments

```sql
id (PK)
faculty_id (FK→faculties)
name (VARCHAR)
name_ar (VARCHAR, NULL)
code (VARCHAR)
scope (VARCHAR, NULL) - "university", "faculty", or "department"
is_mandatory (BOOLEAN, default: false)
required_credit_hours (INTEGER, NULL)
logo_path (VARCHAR, NULL)
created_at, updated_at
```

### 7. professors

```sql
id (PK)
user_id (FK→users, UNIQUE)
staff_number (VARCHAR, UNIQUE)
department_id (FK→departments)
specialization (VARCHAR, NULL)
academic_rank (VARCHAR) - "Assistant Professor", "Associate Professor", "Professor"
office_location (VARCHAR, NULL)
hired_at (DATE)
created_at, updated_at
```

### 8. employees

```sql
id (PK)
user_id (FK→users, UNIQUE)
staff_number (VARCHAR, UNIQUE)
department_id (FK→departments)
position (VARCHAR)
hired_at (DATE)
created_at, updated_at
```

### 9. students

```sql
id (PK)
user_id (FK→users, UNIQUE)
student_number (VARCHAR, UNIQUE)
faculty_id (FK→faculties)
department_id (FK→departments)
academic_year (INTEGER)
semester (INTEGER) - 1 or 2
enrollment_status (VARCHAR) - "active", "graduated", "suspended"
gpa (DECIMAL(3,2)) - 0.00 to 4.00
academic_standing (VARCHAR) - "good", "probation", "suspension"
enrolled_at (DATE)
graduated_at (DATE, NULL)
created_at, updated_at
```

### 10. student_department_histories

```sql
id (PK)
student_id (FK→students)
department_id (FK→departments)
academic_year (INTEGER)
semester (INTEGER)
reason (VARCHAR, NULL)
created_at, updated_at
```

### 11. courses

```sql
id (PK)
code (VARCHAR, UNIQUE)
name (VARCHAR)
name_ar (VARCHAR, NULL)
description (TEXT, NULL)
credit_hours (INTEGER)
lecture_hours (INTEGER)
lab_hours (INTEGER)
level (INTEGER) - 100-400 level
is_elective (BOOLEAN, default: false)
is_active (BOOLEAN, default: true)
created_at, updated_at
```

### 12. department_course (Pivot)

```sql
id (PK)
department_id (FK→departments)
course_id (FK→courses)
is_owner (BOOLEAN) - primary department teaching course
created_at, updated_at
```

### 13. course_prerequisites (Self-Referential)

```sql
id (PK)
course_id (FK→courses)
prerequisite_id (FK→courses)
created_at, updated_at
```

### 14. academic_terms

```sql
id (PK)
name (VARCHAR) - "Spring 2025", "Fall 2024"
start_date (DATE)
end_date (DATE)
registration_start (DATE)
registration_end (DATE)
is_active (BOOLEAN, default: false)
created_at, updated_at
```

### 15. sections

```sql
id (PK)
course_id (FK→courses)
professor_id (FK→professors)
academic_term_id (FK→academic_terms)
semester (INTEGER) - 1 or 2
capacity (INTEGER)
schedule (JSONB) - { days: [1,3,5], start_time: "09:00", end_time: "10:30", location: "Room 101" }
created_at, updated_at
```

### 16. enrollments

```sql
id (PK)
student_id (FK→students)
section_id (FK→sections)
academic_term_id (FK→academic_terms)
status (VARCHAR) - "active", "completed", "dropped"
registered_at (TIMESTAMP)
dropped_at (TIMESTAMP, NULL)
created_at, updated_at
```

### 17. enrollment_waitlists

```sql
id (PK)
student_id (FK→students)
section_id (FK→sections)
academic_term_id (FK→academic_terms)
position (INTEGER)
priority_score (DECIMAL(4,2)) - for priority calculation
requested_at (TIMESTAMP)
created_at, updated_at
```

### 18. grades

```sql
id (PK)
enrollment_id (FK→enrollments, UNIQUE)
points (INTEGER) - 0-100
letter_grade (VARCHAR) - A, B, C, D, F
status (VARCHAR) - "complete", "incomplete"
created_at, updated_at
```

### 19. student_term_gpas

```sql
id (PK)
student_id (FK→students)
academic_term_id (FK→academic_terms)
gpa (DECIMAL(3,2))
credit_hours_completed (INTEGER)
created_at, updated_at
UNIQUE (student_id, academic_term_id)
```

### 20. announcements (University-wide)

```sql
id (PK)
user_id (FK→users)
title (VARCHAR)
content (TEXT)
published_at (TIMESTAMP)
is_published (BOOLEAN, default: true)
created_at, updated_at
```

### 21. announcement_reads (Pivot)

```sql
id (PK)
user_id (FK→users)
announcement_id (FK→announcements)
read_at (TIMESTAMP)
UNIQUE (user_id, announcement_id)
```

### 22. section_announcements (Course-specific)

```sql
id (PK)
section_id (FK→sections)
user_id (FK→users) - professor
title (VARCHAR)
content (TEXT)
published_at (TIMESTAMP)
created_at, updated_at
```

### 23. attendance_sessions

```sql
id (PK)
section_id (FK→sections)
date (DATE)
session_number (INTEGER)
status (VARCHAR) - "open", "closed", "archived"
created_at, updated_at
```

### 24. attendance_records

```sql
id (PK)
attendance_session_id (FK→attendance_sessions)
student_id (FK→students)
status (VARCHAR) - "present", "absent", "late"
note (TEXT, NULL)
created_at, updated_at
```

### 25. course_ratings

```sql
id (PK)
enrollment_id (FK→enrollments, UNIQUE)
rating (SMALLINT) - 1-5
feedback (TEXT, NULL)
submitted_at (TIMESTAMP)
created_at, updated_at
```

### 26. audit_logs

```sql
id (PK)
user_id (FK→users, NULL)
action (VARCHAR) - "create", "update", "delete"
auditable_type (VARCHAR) - Model class name
auditable_id (INTEGER)
description (TEXT)
old_values (JSONB, NULL)
new_values (JSONB, NULL)
ip_address (VARCHAR, NULL)
created_at (TIMESTAMP) - NOT NULL but managed by app
```

### 27. webhooks

```sql
id (PK)
user_id (FK→users)
url (VARCHAR)
secret (VARCHAR) - for HMAC verification
events (JSONB) - array of event names
is_active (BOOLEAN, default: true)
failure_count (INTEGER, default: 0)
last_triggered_at (TIMESTAMP, NULL)
created_at, updated_at
```

### 28. webhook_deliveries

```sql
id (PK)
webhook_id (FK→webhooks)
event (VARCHAR)
payload (JSONB)
status (VARCHAR) - "pending", "delivered", "failed"
response (TEXT, NULL)
attempt_count (INTEGER, default: 0)
next_retry_at (TIMESTAMP, NULL)
created_at, updated_at
```

### 29. university_vice_presidents

```sql
id (PK)
user_id (FK→users)
university_id (FK→universities)
department (VARCHAR) - "Academic Affairs", "Student Services", etc.
appointed_at (DATE)
created_at, updated_at
```

### 30. notifications (Laravel Notifications Table)

```sql
id (PK, UUID or String)
notifiable_type (VARCHAR) - "App\Models\User"
notifiable_id (BIGINT)
type (VARCHAR) - "App\Notifications\EnrollmentNotification"
data (JSONB)
read_at (TIMESTAMP, NULL)
created_at, updated_at
```

### 31. password_reset_tokens

```sql
email (VARCHAR, PRIMARY KEY)
token (VARCHAR)
created_at (TIMESTAMP)
```

### 32. personal_access_tokens (Sanctum)

```sql
id (PK)
tokenable_type (VARCHAR) - "App\Models\User"
tokenable_id (BIGINT)
name (VARCHAR)
token (VARCHAR, UNIQUE) - hashed
abilities (JSONB, NULL)
last_used_at (TIMESTAMP, NULL)
expires_at (TIMESTAMP, NULL)
created_at, updated_at
```

### 33. cache (Laravel Cache Table)

```sql
key (VARCHAR, PRIMARY KEY)
value (MEDIUMTEXT)
expiration (INTEGER)
```

### 34. jobs (Laravel Queue Table)

```sql
id (PK)
queue (VARCHAR)
payload (LONGTEXT)
attempts (TINYINT)
reserved_at (TIMESTAMP, NULL)
available_at (TIMESTAMP)
created_at (TIMESTAMP)
```

---

## Migration Order (Sequential)

1. Universities
2. Roles
3. Users
4. RoleUser (Pivot)
5. Faculties
6. Departments
7. Professors
8. Employees
9. Students
10. StudentDepartmentHistories
11. Courses
12. DepartmentCourse (Pivot)
13. CoursePrerequisites (Self-join)
14. AcademicTerms
15. Sections
16. Enrollments
17. EnrollmentWaitlists
18. Grades
19. StudentTermGpas
20. Announcements
21. AnnouncementReads
22. SectionAnnouncements
23. AttendanceSessions
24. AttendanceRecords
25. CourseRatings
26. AuditLogs
27. Webhooks
28. WebhookDeliveries
29. UniversityVicePresidents
30. Notifications (Laravel)
31. PasswordResetTokens
32. PersonalAccessTokens (Sanctum)
33. Cache
34. Jobs

---

## Key Considerations

### Foreign Keys

- All ForeignKey constraints should be enabled
- ON DELETE CASCADE for dependent records
- ON UPDATE CASCADE for parent updates

### Indexes

- Primary keys on all tables (automatic)
- UNIQUE on: national_id, email, course code, student number, staff number
- Foreign keys should auto-index
- Composite indexes for common queries:
  - (user_id, role_id) on role_user
  - (student_id, status) on enrollments
  - (section_id, student_id) on attendance_records

### Soft Deletes

- Only on users table
- Use `deleted_at` field
- Query filters must exclude soft-deleted records

### Timestamps

- All tables except audit_logs use created_at, updated_at
- audit_logs manages its own created_at
- Some tables have business timestamps (published_at, hired_at, etc.)

### JSONB Fields

- schedule on sections: `{ days: [1,3,5], start_time, end_time, location }`
- events on webhooks: `["enrollment.created", "grade.submitted", ...]`
- permissions on roles: `{ "create_users", "edit_grades", ... }`
- data on notifications: payload for notification
- old_values / new_values on audit_logs: before/after state
- payload on webhook_deliveries: event data sent

### Type Mappings

- Student status enum: active, graduated, suspended
- Enrollment status enum: active, completed, dropped
- Attendance status enum: present, absent, late
- Grade status enum: complete, incomplete
- Academic standing enum: good, probation, suspension
- Role scopes: university_id, faculty_id, department_id, NULL (global)

---

## Relationships Overview

```bash
User (1) ─→ (N) RoleUser
User (1) ─→ (1) Student
User (1) ─→ (1) Professor
User (1) ─→ (1) Employee

Role (1) ─→ (N) RoleUser
University (1) ─→ (N) Faculty
University (1) ─→ (N) UniversityVicePresident
Faculty (1) ─→ (N) Department
Department (1) ─→ (N) Professor
Department (1) ─→ (N) Employee
Department (1) ─→ (N) Student

Course (1) ─→ (N) Section
Course (N) ─→ (N) Department (via DepartmentCourse)
Course (N) ─→ (N) Course (self-join for prerequisites)

AcademicTerm (1) ─→ (N) Section
AcademicTerm (1) ─→ (N) Enrollment
Section (1) ─→ (N) Enrollment
Section (1) ─→ (N) AttendanceSession
Section (1) ─→ (N) SectionAnnouncement

Student (1) ─→ (N) Enrollment
Student (1) ─→ (N) AttendanceRecord
Student (1) ─→ (N) StudentDepartmentHistory
Student (1) ─→ (N) StudentTermGpa
Student (1) ─→ (N) EnrollmentWaitlist
Enrollment (1) ─→ (1) Grade
Enrollment (1) ─→ (1) CourseRating

Professor (1) ─→ (N) Section
AttendanceSession (1) ─→ (N) AttendanceRecord

Webhook (1) ─→ (N) WebhookDelivery
Announcement (1) ─→ (N) AnnouncementRead

AuditLog ─→ User, Model (polymorphic)
Notification ─→ User (polymorphic via notifiable)
```

---

## Data Volume Estimation

For a typical medium-sized university:

- Users: 10,000-50,000
- Students: 5,000-20,000
- Faculty/Professors: 200-500
- Departments: 20-50
- Courses: 500-2,000
- Sections/Offerings: 2,000-5,000
- Enrollments: 50,000-200,000
- Grades: 50,000-200,000
- Audit Logs: 500,000+ (grows continuously)

---

## Backup & Recovery Strategy

1. Daily automated backups to external storage
2. Point-in-time recovery capability (14-30 days)
3. Audit log archival for compliance
4. Transaction-level consistency
5. Replicated read-only copies for reporting

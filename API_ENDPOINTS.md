# UniOne API Endpoints - Complete Reference

## Authentication Endpoints

### Public Routes (Rate Limited)

```bash
POST /api/auth/login
├── Rate Limit: throttle:api.login
├── Auth: None
├── Body: { email, password }
└── Returns: { token, user }

POST /api/auth/forgot-password
├── Rate Limit: throttle:api.password
├── Auth: None
├── Body: { email }
└── Returns: { message }

POST /api/auth/reset-password
├── Rate Limit: throttle:api.password
├── Auth: None
├── Body: { email, token, password, password_confirmation }
└── Returns: { message }
```

### Protected Routes (Authenticated)

```bash
POST /api/auth/logout
├── Rate Limit: throttle:api (60 req/min)
├── Auth: Bearer token
├── Body: {}
└── Returns: { message }

GET /api/auth/me
├── Rate Limit: throttle:api
├── Auth: Bearer token
├── Body: N/A
└── Returns: { user_id, email, first_name, last_name, roles[...] }

POST /api/auth/change-password
├── Rate Limit: throttle:api
├── Auth: Bearer token
├── Body: { current_password, password, password_confirmation }
└── Returns: { message }

PATCH /api/auth/profile
├── Rate Limit: throttle:api
├── Auth: Bearer token
├── Body: { phone?, date_of_birth?, avatar_path? }
└── Returns: { user }

GET /api/auth/tokens
├── Rate Limit: throttle:api
├── Auth: Bearer token
├── Body: N/A
└── Returns: { tokens[] }

DELETE /api/auth/tokens
├── Rate Limit: throttle:api
├── Auth: Bearer token
├── Body: {}
└── Returns: { message }

DELETE /api/auth/tokens/{tokenId}
├── Rate Limit: throttle:api
├── Auth: Bearer token
├── Body: N/A
└── Returns: { message }
```

---

## Student Portal Endpoints

### Profile & Academic

```bash
GET /api/student/profile
├── Auth: Bearer token + Role: student
├── Returns: { student_number, faculty, department, gpa, standing }

GET /api/student/grades
├── Auth: Bearer token + Role: student
├── Query: ?academic_term_id=, ?department_id=
├── Returns: { grades[] }

GET /api/student/transcript
├── Auth: Bearer token + Role: student
├── Query: ?format=json (extended, detailed)
├── Returns: { academic_history, total_gpa, earned_credits }

GET /api/student/transcript/pdf
├── Auth: Bearer token + Role: student
├── Query: N/A
└── Returns: PDF file (binary)

GET /api/student/academic-history
├── Auth: Bearer token + Role: student
├── Query: ?include_departments=true
└── Returns: { periods[], transfers[] }
```

### Enrollment Management

```bash
GET /api/student/enrollments
├── Auth: Bearer token + Role: student
├── Query: ?status=active, ?academic_term_id=
├── Returns: { enrollments[{ section, course, professor, schedule }] }

POST /api/student/enrollments
├── Auth: Bearer token + Role: student
├── Rate Limit: throttle:api.enroll
├── Body: { section_id, academic_term_id }
├── Validation: Prerequisites, capacity, prereqs
└── Returns: { enrollment }

DELETE /api/student/enrollments/{enrollmentId}
├── Auth: Bearer token + Role: student
├── Rate Limit: throttle:api.enroll
├── Body: {}
├── Validation: Within drop deadline
└── Returns: { message }

GET /api/student/waitlist
├── Auth: Bearer token + Role: student
├── Query: N/A
└── Returns: { waitlist_entries[] }

DELETE /api/student/waitlist/{sectionId}
├── Auth: Bearer token + Role: student
├── Body: {}
└── Returns: { message }
```

### Schedule & Attendance

```bash
GET /api/student/schedule
├── Auth: Bearer token + Role: student
├── Query: ?academic_term_id=
└── Returns: { schedule[] } // Array of sections with time/location

GET /api/student/schedule/ics
├── Auth: Bearer token + Role: student
├── Query: ?academic_term_id=
└── Returns: iCalendar format (.ics file)

GET /api/student/attendance
├── Auth: Bearer token + Role: student
├── Query: ?section_id=, ?academic_term_id=
└── Returns: { attendance_records[{ section, status, date }] }
```

### Ratings & Announcements

```bash
GET /api/student/ratings
├── Auth: Bearer token + Role: student
├── Query: ?academic_term_id=
└── Returns: { ratings[] }

POST /api/student/ratings
├── Auth: Bearer token + Role: student
├── Body: { enrollment_id, rating (1-5), feedback? }
├── Validation: Student must be enrolled, course completed
└── Returns: { rating }

GET /api/student/sections/{sectionId}/announcements
├── Auth: Bearer token + Role: student
├── Query: ?limit=20, ?offset=0
└── Returns: { announcements[] }
```

---

## Professor Portal Endpoints

### Profile & Teaching Assignment

```bash
GET /api/professor/profile
├── Auth: Bearer token + Role: professor
├── Returns: { staff_number, department, specialization, academic_rank }

GET /api/professor/sections
├── Auth: Bearer token + Role: professor
├── Query: ?academic_term_id= (defaults to current)
└── Returns: { sections[{ course, schedule, enrollment_count }] }

GET /api/professor/schedule
├── Auth: Bearer token + Role: professor
├── Query: ?academic_term_id=
└── Returns: { schedule[] }
```

### Student & Grade Management

```bash
GET /api/professor/sections/{sectionId}/students
├── Auth: Bearer token + Role: professor
├── Query: ?enrollment_status=active
└── Returns: { students[{ name, student_number, enrollment_status }] }

GET /api/professor/sections/{sectionId}/grades
├── Auth: Bearer token + Role: professor
├── Query: ?limit=50
└── Returns: { grades[{ student, points, letter_grade, status }] }

POST /api/professor/sections/{sectionId}/grades
├── Auth: Bearer token + Role: professor
├── Rate Limit: throttle:api.grade
├── Body: { grades[{ enrollment_id, points }] }
├── Validation: Points 0-100, enrollment in section
├── Side Effect: Sends final-grade publication email to affected students
└── Returns: { grades[] }
```

### Attendance Management

```bash
GET /api/professor/sections/{sectionId}/attendance
├── Auth: Bearer token + Role: professor
├── Query: ?limit=20
└── Returns: { attendance_sessions[] }

POST /api/professor/sections/{sectionId}/attendance
├── Auth: Bearer token + Role: professor
├── Body: { date, session_number }
└── Returns: { attendance_session (ready for recording) }

GET /api/professor/sections/{sectionId}/attendance/{sessionId}
├── Auth: Bearer token + Role: professor
└── Returns: { attendance_session, attendance_records[] }

PUT /api/professor/sections/{sectionId}/attendance/{sessionId}
├── Auth: Bearer token + Role: professor
├── Body: { records[{ student_id, status, note? }] }
├── Validations: Status in (present, absent, late)
└── Returns: { attendance_records[] }
```

### Announcements (Section-Specific)

```bash
GET /api/professor/sections/{sectionId}/announcements
├── Auth: Bearer token + Role: professor
├── Query: ?limit=20
└── Returns: { announcements[] }

POST /api/professor/sections/{sectionId}/announcements
├── Auth: Bearer token + Role: professor
├── Body: { title, content }
├── Side Effect: Sends announcement email to enrolled students
└── Returns: { announcement }

DELETE /api/professor/sections/{sectionId}/announcements/{announcementId}
├── Auth: Bearer token + Role: professor
├── Body: {}
└── Returns: { message }
```

---

## Shared Endpoints (Any Authenticated User)

### Announcements (University-Wide)

```bash
GET /api/announcements
├── Auth: Bearer token
├── Query: ?limit=20, ?offset=0, ?unread_only=false
└── Returns: { announcements[] }

POST /api/announcements/{announcementId}/read
├── Auth: Bearer token
├── Body: {}
└── Returns: { announcement (with read timestamp) }
```

### Notifications

```bash
GET /api/notifications
├── Auth: Bearer token
├── Query: ?limit=20, ?offset=0, ?unread_only=false
└── Returns: { notifications[] }

POST /api/notifications/read-all
├── Auth: Bearer token
├── Body: {}
└── Returns: { message, count_updated }

POST /api/notifications/{notificationId}/read
├── Auth: Bearer token
├── Body: {}
└── Returns: { notification (with read_at) }

DELETE /api/notifications/{notificationId}
├── Auth: Bearer token
├── Body: {}
└── Returns: { message }
```

---

## Admin Endpoints

### Section Teaching Assistants

```bash
GET /api/admin/sections/{sectionId}/teaching-assistants
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
└── Returns: { teaching_assistants[] }

POST /api/admin/sections/{sectionId}/teaching-assistants
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
├── Body: { professor_id }
└── Returns: { assignment }

DELETE /api/admin/sections/{sectionId}/teaching-assistants/{taId}
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
└── Returns: { deleted: true }
```

---

### Section Exam Schedules

```bash
GET /api/admin/sections/{sectionId}/exam-schedule
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
└── Returns: { exam_schedule }

POST /api/admin/sections/{sectionId}/exam-schedule
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
├── Body: { exam_date, start_time, end_time, location? }
└── Returns: { exam_schedule }

PATCH /api/admin/sections/{sectionId}/exam-schedule
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
├── Body: { exam_date?, start_time?, end_time?, location? }
└── Returns: { exam_schedule }

POST /api/admin/sections/{sectionId}/exam-schedule/publish
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
├── Side Effect: Sends exam-schedule publication email to enrolled students
└── Returns: { exam_schedule (published) }
```

---

### Section Group Projects

```bash
GET /api/admin/sections/{sectionId}/group-projects
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
└── Returns: [group_projects]

POST /api/admin/sections/{sectionId}/group-projects
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
├── Body: { title, description?, due_at?, max_members?, is_active? }
└── Returns: { group_project }

PATCH /api/admin/sections/{sectionId}/group-projects/{projectId}
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
├── Body: { title?, description?, due_at?, max_members?, is_active? }
└── Returns: { group_project }

DELETE /api/admin/sections/{sectionId}/group-projects/{projectId}
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
└── Returns: { deleted: true }

POST /api/admin/sections/{sectionId}/group-projects/{projectId}/members
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
├── Body: { student_id }
└── Returns: { group_project_member }

DELETE /api/admin/sections/{sectionId}/group-projects/{projectId}/members/{memberId}
├── Auth: Bearer token + Role: admin|university_admin|faculty_admin|department_admin
└── Returns: { deleted: true }
```

---

### Webhook Management

```bash
GET /api/admin/webhooks
├── Auth: Bearer token + Role: admin|faculty_admin|department_admin
├── Query: ?limit=20, ?is_active=true
└── Returns: { webhooks[] }

POST /api/admin/webhooks
├── Auth: Bearer token + Role: admin|faculty_admin|department_admin
├── Body: { url, events[], secret }
├── Validation: Valid URL, secret > 16 chars, events array not empty
└── Returns: { webhook }

PATCH /api/admin/webhooks/{webhookId}
├── Auth: Bearer token + Role: admin|faculty_admin|department_admin
├── Body: { url?, events[], is_active? }
└── Returns: { webhook (updated) }

DELETE /api/admin/webhooks/{webhookId}
├── Auth: Bearer token + Role: admin|faculty_admin|department_admin
├── Body: {}
└── Returns: { message }

GET /api/admin/webhooks/{webhookId}/deliveries
├── Auth: Bearer token + Role: admin|faculty_admin|department_admin
├── Query: ?limit=50, ?status=failed
└── Returns: { deliveries[{ event, status, response, attempted_at }] }
```

---

## Response Format Standards

### Success Response

```json
{
  "status": "success",
  "message": "Operation completed",
  "data": { /* actual data */ }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Pagination Response

```json
{
  "status": "success",
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Rate Limiting Rules

### Public Routes

- `throttle:api.login` - 5 attempts per 15 minutes
- `throttle:api.password` - 3 attempts per 60 minutes

### Authenticated Routes

- `throttle:api` - 60 requests per minute (default)
- `throttle:api.enroll` - 10 enrollments per hour
- `throttle:api.grade` - 100 grades per hour

---

## HTTP Status Codes

| Code | Meaning | Scenario |
| ------ | --------- | ---------- |
| 200 | OK | Successful GET/POST/PATCH |
| 201 | Created | Resource successfully created |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable | Business logic violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected error |

---

## Query Parameters Conventions

### Filters

```bash
?status=active
?department_id=5
?academic_term_id=12
```

### Pagination

```bash
?page=1&limit=20
?offset=0&limit=50
```

### Sorting

```bash
?sort=created_at:desc
?sort=gpa:asc
```

### Relationships

```bash
?include=professor,course
?include=grades,enrollments
```

---

## Webhook Events

Possible events to subscribe:

- `enrollment.created`
- `enrollment.dropped`
- `grade.submitted`
- `attendance.recorded`
- `student.created`
- `announcement.published`
- `academic_term.started`
- `academic_term.ended`

---

## Authentication Header Format

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token structure:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "roles": ["student"],
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## Total Endpoint Count: 52+

- Authentication: 10 endpoints
- Student: 15 endpoints
- Professor: 13 endpoints
- Shared: 8 endpoints
- Admin: 5 endpoints
- System: 1+ endpoints (health check, etc.)

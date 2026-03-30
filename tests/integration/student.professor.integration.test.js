import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import app from '../../src/server.js';
import db from '../../src/config/knex.js';

describe('Student and professor domain integration', () => {
  let studentToken;
  let studentEmail;
  let professorToken;
  let professorEmail;

  beforeAll(async () => {
    const student = await db('users as u')
      .join('students as s', 's.user_id', 'u.id')
      .select('u.email')
      .first();

    studentEmail = student.email;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: '241996' })
      .expect(200);

    studentToken = studentLogin.body.data.token;

    const professor = await db('users as u')
      .join('professors as p', 'p.user_id', 'u.id')
      .select('u.email')
      .first();

    professorEmail = professor.email;

    const professorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: professorEmail, password: '241996' })
      .expect(200);

    professorToken = professorLogin.body.data.token;
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('student read endpoints work and enforce role boundaries', async () => {
    await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .get('/api/student/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .get('/api/student/grades')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .get('/api/student/attendance')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .get('/api/student/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const transcriptRes = await request(app)
      .get('/api/student/transcript')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(transcriptRes.body.data).toHaveProperty('transcript.total_gpa');

    await request(app)
      .get('/api/student/transcript/pdf')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect('Content-Type', /application\/pdf/)
      .expect(200);

    const scheduleRes = await request(app)
      .get('/api/student/schedule')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(scheduleRes.body.data)).toBe(true);

    const icsRes = await request(app)
      .get('/api/student/schedule/ics')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect('Content-Type', /text\/calendar/)
      .expect(200);

    expect(String(icsRes.text)).toContain('BEGIN:VCALENDAR');

    await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(403);
  });

  test('student export endpoints handle empty term filters gracefully', async () => {
    const nonexistentTermId = 99999999;

    const transcriptRes = await request(app)
      .get(`/api/student/transcript?academic_term_id=${nonexistentTermId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(transcriptRes.body.data.transcript.academic_history)).toBe(true);
    expect(transcriptRes.body.data.transcript.academic_history.length).toBe(0);

    const scheduleRes = await request(app)
      .get(`/api/student/schedule?academic_term_id=${nonexistentTermId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(scheduleRes.body.data)).toBe(true);
    expect(scheduleRes.body.data.length).toBe(0);

    const icsRes = await request(app)
      .get(`/api/student/schedule/ics?academic_term_id=${nonexistentTermId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect('Content-Type', /text\/calendar/)
      .expect(200);

    expect(String(icsRes.text)).toContain('BEGIN:VCALENDAR');
    expect(String(icsRes.text)).not.toContain('BEGIN:VEVENT');
  });

  test('student enroll/drop and waitlist flows work', async () => {
    const student = await db('students as s')
      .join('users as u', 'u.id', 's.user_id')
      .whereRaw('LOWER(u.email) = LOWER(?)', [studentEmail])
      .select('s.id as student_id')
      .first();

    const openSection = await db('sections as sec')
      .join('courses as c', 'c.id', 'sec.course_id')
      .leftJoin('course_prerequisites as cp', 'cp.course_id', 'c.id')
      .leftJoin('enrollments as e', 'e.section_id', 'sec.id')
      .where('sec.is_active', true)
      .whereNull('cp.prerequisite_id')
      .whereNotExists(function () {
        this.select(1)
          .from('enrollments as ex')
          .whereRaw('ex.section_id = sec.id')
          .andWhere('ex.student_id', student.student_id);
      })
      .groupBy('sec.id', 'sec.course_id', 'sec.capacity', 'sec.academic_term_id')
      .havingRaw('COUNT(e.id) = 0')
      .select('sec.id', 'sec.academic_term_id')
      .first();

    const enrollRes = await request(app)
      .post('/api/student/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ section_id: openSection.id, academic_term_id: openSection.academic_term_id })
      .expect(201);

    const enrollmentId = enrollRes.body.data.id;

    await request(app)
      .delete(`/api/student/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const fullSection = await db('sections as sec')
      .join('courses as c', 'c.id', 'sec.course_id')
      .leftJoin('course_prerequisites as cp', 'cp.course_id', 'c.id')
      .join('enrollments as e', 'e.section_id', 'sec.id')
      .where('sec.is_active', true)
      .whereNull('cp.prerequisite_id')
      .whereNotExists(function () {
        this.select(1)
          .from('enrollments as ex')
          .whereRaw('ex.section_id = sec.id')
          .andWhere('ex.student_id', student.student_id);
      })
      .groupBy('sec.id', 'sec.capacity', 'sec.academic_term_id')
      .havingRaw('COUNT(e.id) >= sec.capacity')
      .select('sec.id', 'sec.academic_term_id')
      .first();

    const waitlistRes = await request(app)
      .post('/api/student/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ section_id: fullSection.id, academic_term_id: fullSection.academic_term_id })
      .expect(202);

    expect(waitlistRes.body.data.section_id).toBe(fullSection.id);

    await request(app)
      .get('/api/student/waitlist')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(app)
      .delete(`/api/student/waitlist/${fullSection.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
  });

  test('student enrollment checks registration window and withdrawal deadlines', async () => {
    const student = await db('students as s')
      .join('users as u', 'u.id', 's.user_id')
      .whereRaw('LOWER(u.email) = LOWER(?)', [studentEmail])
      .select('s.id as student_id')
      .first();

    const professor = await db('professors').select('id').first();

    const seed = Date.now();
    const termYear = 3000 + Number(String(seed).slice(-3));
    const semesterOptions = ['first', 'second', 'summer'];
    const termSemester = semesterOptions[seed % semesterOptions.length];

    const [term] = await db('academic_terms')
      .insert({
        name: `Closed Term ${seed}`,
        name_ar: `Closed Term ${seed}`,
        academic_year: termYear,
        semester: termSemester,
        starts_at: '2099-06-01',
        ends_at: '2099-08-30',
        registration_starts_at: '2000-01-01',
        registration_ends_at: '2000-01-15',
        withdrawal_deadline: '2000-01-20',
        is_active: false,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const [course] = await db('courses')
      .insert({
        code: `TST-${Date.now()}`,
        name: 'Constraint Test Course',
        name_ar: 'Constraint Test Course',
        description: 'Course for integration constraint checks',
        credit_hours: 3,
        lecture_hours: 3,
        lab_hours: 0,
        level: 1,
        is_elective: false,
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const [section] = await db('sections')
      .insert({
        course_id: course.id,
        professor_id: professor.id,
        capacity: 20,
        room: 'T-101',
        schedule: JSON.stringify({ days: [1], start_time: '09:00', end_time: '10:00', location: 'T-101' }),
        is_active: true,
        academic_term_id: term.id,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    await request(app)
      .post('/api/student/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ section_id: section.id, academic_term_id: term.id })
      .expect(403);

    const [enrollment] = await db('enrollments')
      .insert({
        student_id: student.student_id,
        section_id: section.id,
        academic_term_id: term.id,
        status: 'registered',
        registered_at: db.fn.now(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    await request(app)
      .delete(`/api/student/enrollments/${enrollment.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);
  });

  test('student can submit rating for completed enrollment', async () => {
    const student = await db('students as s')
      .join('users as u', 'u.id', 's.user_id')
      .whereRaw('LOWER(u.email) = LOWER(?)', [studentEmail])
      .select('s.id as student_id')
      .first();

    const professor = await db('professors').select('id').first();

    const [term] = await db('academic_terms')
      .insert({
        name: `Rating Term ${Date.now()}`,
        name_ar: `Rating Term ${Date.now()}`,
        academic_year: 4500 + Math.floor(Math.random() * 400),
        semester: 'first',
        starts_at: '2099-01-01',
        ends_at: '2099-05-30',
        registration_starts_at: '2098-12-01',
        registration_ends_at: '2099-01-15',
        withdrawal_deadline: '2099-02-15',
        is_active: false,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const [course] = await db('courses')
      .insert({
        code: `RT-${Date.now()}`,
        name: 'Rating Integration Course',
        name_ar: 'Rating Integration Course',
        description: 'Course for student rating integration test',
        credit_hours: 3,
        lecture_hours: 3,
        lab_hours: 0,
        level: 2,
        is_elective: false,
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const [section] = await db('sections')
      .insert({
        course_id: course.id,
        professor_id: professor.id,
        capacity: 40,
        room: 'R-220',
        schedule: JSON.stringify({ days: [2], start_time: '10:00', end_time: '11:00' }),
        is_active: true,
        academic_term_id: term.id,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const [enrollment] = await db('enrollments')
      .insert({
        student_id: student.student_id,
        section_id: section.id,
        academic_term_id: term.id,
        status: 'completed',
        registered_at: db.fn.now(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    await request(app)
      .post('/api/student/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ enrollment_id: enrollment.id, rating: 5, comment: 'Excellent course' })
      .expect(201);

    const ratingsRes = await request(app)
      .get('/api/student/ratings')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(ratingsRes.body.data.some((row) => Number(row.enrollment_id) === Number(enrollment.id))).toBe(true);
  });

  test('webhook deliveries are recorded for enrollment and grade events', async () => {
    const hasWebhooksTable = await db.schema.hasTable('webhooks');
    const hasDeliveriesTable = await db.schema.hasTable('webhook_deliveries');

    if (!hasWebhooksTable || !hasDeliveriesTable) {
      return;
    }

    const studentUser = await db('users')
      .whereRaw('LOWER(email) = LOWER(?)', [studentEmail])
      .select('id')
      .first();

    const [webhook] = await db('webhooks')
      .insert({
        user_id: studentUser.id,
        url: 'http://127.0.0.1:1/unione-webhook-test',
        secret: 'webhook-secret-test',
        events: JSON.stringify(['enrollment.created', 'grades.submitted']),
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const student = await db('students as s')
      .join('users as u', 'u.id', 's.user_id')
      .whereRaw('LOWER(u.email) = LOWER(?)', [studentEmail])
      .select('s.id as student_id')
      .first();

    const openSection = await db('sections as sec')
      .join('courses as c', 'c.id', 'sec.course_id')
      .leftJoin('course_prerequisites as cp', 'cp.course_id', 'c.id')
      .leftJoin('enrollments as e', 'e.section_id', 'sec.id')
      .where('sec.is_active', true)
      .whereNull('cp.prerequisite_id')
      .whereNotExists(function () {
        this.select(1)
          .from('enrollments as ex')
          .whereRaw('ex.section_id = sec.id')
          .andWhere('ex.student_id', student.student_id);
      })
      .groupBy('sec.id', 'sec.course_id', 'sec.capacity', 'sec.academic_term_id')
      .havingRaw('COUNT(e.id) = 0')
      .select('sec.id', 'sec.academic_term_id')
      .first();

    const enrollRes = await request(app)
      .post('/api/student/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ section_id: openSection.id, academic_term_id: openSection.academic_term_id })
      .expect(201);

    const target = await db('users as u')
      .join('professors as p', 'p.user_id', 'u.id')
      .join('sections as s', 's.professor_id', 'p.id')
      .join('enrollments as e', 'e.section_id', 's.id')
      .whereRaw('LOWER(u.email) = LOWER(?)', [professorEmail])
      .select('s.id as section_id', 'e.id as enrollment_id')
      .first();

    await request(app)
      .post(`/api/professor/sections/${target.section_id}/grades`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ grades: [{ enrollment_id: target.enrollment_id, midterm: 30, final: 30, coursework: 30 }] })
      .expect(200);

    await request(app)
      .delete(`/api/student/enrollments/${enrollRes.body.data.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const deliveries = await db('webhook_deliveries')
      .where({ webhook_id: webhook.id })
      .whereIn('event', ['enrollment.created', 'grades.submitted'])
      .select('event');

    expect(deliveries.length).toBeGreaterThanOrEqual(2);
  });

  test('professor write endpoints for grades and attendance work', async () => {
    const scheduleIcsRes = await request(app)
      .get('/api/professor/schedule/ics')
      .set('Authorization', `Bearer ${professorToken}`)
      .expect('Content-Type', /text\/calendar/)
      .expect(200);

    expect(String(scheduleIcsRes.text)).toContain('BEGIN:VCALENDAR');

    const target = await db('users as u')
      .join('professors as p', 'p.user_id', 'u.id')
      .join('sections as s', 's.professor_id', 'p.id')
      .join('enrollments as e', 'e.section_id', 's.id')
      .join('students as st', 'st.id', 'e.student_id')
      .whereRaw('LOWER(u.email) = LOWER(?)', [professorEmail])
      .select('s.id as section_id', 'e.id as enrollment_id', 'st.id as student_id')
      .first();

    await request(app)
      .post(`/api/professor/sections/${target.section_id}/grades`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        grades: [{ enrollment_id: target.enrollment_id, midterm: 20, final: 40, coursework: 25 }],
      })
      .expect(200);

    const announcementRes = await request(app)
      .post(`/api/professor/sections/${target.section_id}/announcements`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ title: 'Section Integration Update', body: 'Please review chapter 5 before next class.' })
      .expect(201);

    expect(Number(announcementRes.body.data.section_id)).toBe(Number(target.section_id));

    const studentSectionAnnouncements = await request(app)
      .get(`/api/student/sections/${target.section_id}/announcements`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(studentSectionAnnouncements.body.data)).toBe(true);
    expect(studentSectionAnnouncements.body.data.length).toBeGreaterThan(0);

    let createSessionRes;
    let attempt = 1;
    while (!createSessionRes && attempt <= 30) {
      const sessionDate = new Date(Date.now() + attempt * 37 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const response = await request(app)
        .post(`/api/professor/sections/${target.section_id}/attendance`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ session_date: sessionDate, topic: 'Integration attendance topic' });

      if (response.status === 201) {
        createSessionRes = response;
      }

      attempt += 1;
    }

    expect(createSessionRes).toBeTruthy();

    const sessionId = createSessionRes.body.data.id;

    await request(app)
      .put(`/api/professor/sections/${target.section_id}/attendance/${sessionId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ records: [{ student_id: target.student_id, status: 'present', note: 'checked' }] })
      .expect(200);

    await request(app)
      .get(`/api/professor/sections/${target.section_id}/attendance/${sessionId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(200);
  });
});

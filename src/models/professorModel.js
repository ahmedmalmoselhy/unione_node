import db from '../config/knex.js';

export async function findProfessorProfileByUserId(userId) {
  return db('professors as p')
    .join('users as u', 'u.id', 'p.user_id')
    .leftJoin('departments as d', 'd.id', 'p.department_id')
    .select(
      'p.id as professor_id',
      'p.staff_number',
      'p.specialization',
      'p.academic_rank',
      'p.office_location',
      'p.hired_at',
      'u.id as user_id',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.phone',
      'd.id as department_id',
      'd.name as department_name',
      'd.code as department_code'
    )
    .where('p.user_id', userId)
    .first();
}

export async function listProfessorSectionsByUserId(userId, { academicTermId } = {}) {
  const query = db('sections as s')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('courses as c', 'c.id', 's.course_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id')
    .select(
      's.id',
      's.capacity',
      's.room',
      's.schedule',
      's.is_active',
      's.academic_term_id',
      'c.id as course_id',
      'c.code as course_code',
      'c.name as course_name',
      'c.credit_hours',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester'
    )
    .where('p.user_id', userId)
    .orderBy('s.id', 'desc');

  if (academicTermId) {
    query.andWhere('s.academic_term_id', academicTermId);
  }

  return query;
}

export async function findProfessorSectionById(userId, sectionId) {
  return db('sections as s')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('courses as c', 'c.id', 's.course_id')
    .select('s.id', 'c.code as course_code', 'c.name as course_name')
    .where('p.user_id', userId)
    .andWhere('s.id', sectionId)
    .first();
}

export async function listSectionEnrollmentIds(sectionId) {
  const rows = await db('enrollments').where({ section_id: sectionId }).select('id', 'student_id');
  return new Map(rows.map((row) => [Number(row.id), Number(row.student_id)]));
}

export async function listProfessorSectionStudents(userId, sectionId) {
  return db('enrollments as e')
    .join('sections as s', 's.id', 'e.section_id')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('students as st', 'st.id', 'e.student_id')
    .join('users as su', 'su.id', 'st.user_id')
    .select(
      'e.id as enrollment_id',
      'e.status as enrollment_status',
      'st.id as student_id',
      'st.student_number',
      'su.first_name',
      'su.last_name',
      'su.email'
    )
    .where('p.user_id', userId)
    .andWhere('s.id', sectionId)
    .orderBy('st.student_number', 'asc');
}

export async function listProfessorSectionGrades(userId, sectionId) {
  return db('enrollments as e')
    .join('sections as s', 's.id', 'e.section_id')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('courses as c', 'c.id', 's.course_id')
    .join('students as st', 'st.id', 'e.student_id')
    .join('users as su', 'su.id', 'st.user_id')
    .leftJoin('grades as g', 'g.enrollment_id', 'e.id')
    .select(
      'e.id as enrollment_id',
      'st.id as student_id',
      'st.student_number',
      'su.first_name',
      'su.last_name',
      'su.email',
      'c.code as course_code',
      'c.name as course_name',
      'e.status as enrollment_status',
      'g.id as grade_id',
      'g.midterm',
      'g.final',
      'g.coursework',
      'g.total',
      'g.letter_grade',
      'g.grade_points',
      'g.graded_at'
    )
    .where('p.user_id', userId)
    .andWhere('s.id', sectionId)
    .orderBy('st.student_number', 'asc');
}

export async function upsertSectionGrades(gradeRows, gradedByUserId) {
  const payload = gradeRows.map((row) => ({
    ...row,
    graded_by: gradedByUserId,
    graded_at: db.fn.now(),
    updated_at: db.fn.now(),
    created_at: db.fn.now(),
  }));

  await db('grades')
    .insert(payload)
    .onConflict('enrollment_id')
    .merge({
      midterm: db.raw('excluded.midterm'),
      final: db.raw('excluded.final'),
      coursework: db.raw('excluded.coursework'),
      total: db.raw('excluded.total'),
      letter_grade: db.raw('excluded.letter_grade'),
      grade_points: db.raw('excluded.grade_points'),
      graded_by: db.raw('excluded.graded_by'),
      graded_at: db.raw('excluded.graded_at'),
      updated_at: db.raw('excluded.updated_at'),
    });
}

export async function createAttendanceSession(sectionId, userId, sessionDate, topic = null) {
  const [created] = await db('attendance_sessions')
    .insert({
      section_id: sectionId,
      created_by: userId,
      session_date: sessionDate,
      topic,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(['id', 'section_id', 'created_by', 'session_date', 'topic', 'created_at', 'updated_at']);

  return created;
}

export async function listProfessorAttendanceSessions(userId, sectionId) {
  return db('attendance_sessions as s')
    .join('sections as sec', 'sec.id', 's.section_id')
    .join('professors as p', 'p.id', 'sec.professor_id')
    .where('p.user_id', userId)
    .andWhere('s.section_id', sectionId)
    .select('s.id', 's.section_id', 's.session_date', 's.topic', 's.created_at', 's.updated_at')
    .orderBy('s.session_date', 'desc');
}

export async function findProfessorAttendanceSession(userId, sectionId, sessionId) {
  return db('attendance_sessions as s')
    .join('sections as sec', 'sec.id', 's.section_id')
    .join('professors as p', 'p.id', 'sec.professor_id')
    .where('p.user_id', userId)
    .andWhere('s.section_id', sectionId)
    .andWhere('s.id', sessionId)
    .select('s.id', 's.section_id', 's.session_date', 's.topic', 's.created_at', 's.updated_at')
    .first();
}

export async function upsertAttendanceRecords(sessionId, records) {
  const payload = records.map((r) => ({
    attendance_session_id: sessionId,
    student_id: r.student_id,
    status: r.status,
    note: r.note || null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  }));

  await db('attendance_records')
    .insert(payload)
    .onConflict(['attendance_session_id', 'student_id'])
    .merge({
      status: db.raw('excluded.status'),
      note: db.raw('excluded.note'),
      updated_at: db.raw('excluded.updated_at'),
    });
}

export async function listAttendanceRecordsBySession(sessionId) {
  return db('attendance_records as r')
    .join('students as st', 'st.id', 'r.student_id')
    .join('users as u', 'u.id', 'st.user_id')
    .where('r.attendance_session_id', sessionId)
    .select(
      'r.id',
      'r.student_id',
      'st.student_number',
      'u.first_name',
      'u.last_name',
      'r.status',
      'r.note',
      'r.updated_at'
    )
    .orderBy('st.student_number', 'asc');
}

export default {
  findProfessorProfileByUserId,
  listProfessorSectionsByUserId,
  findProfessorSectionById,
  listSectionEnrollmentIds,
  listProfessorSectionStudents,
  listProfessorSectionGrades,
  upsertSectionGrades,
  createAttendanceSession,
  listProfessorAttendanceSessions,
  findProfessorAttendanceSession,
  upsertAttendanceRecords,
  listAttendanceRecordsBySession,
};

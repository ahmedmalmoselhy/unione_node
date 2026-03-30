import db from '../config/knex.js';

export async function findStudentProfileByUserId(userId) {
  return db('students as s')
    .join('users as u', 'u.id', 's.user_id')
    .leftJoin('faculties as f', 'f.id', 's.faculty_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .select(
      's.id as student_id',
      's.student_number',
      's.academic_year',
      's.semester',
      's.enrollment_status',
      's.gpa',
      's.academic_standing',
      's.enrolled_at',
      's.graduated_at',
      'u.id as user_id',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.phone',
      'f.id as faculty_id',
      'f.name as faculty_name',
      'f.code as faculty_code',
      'd.id as department_id',
      'd.name as department_name',
      'd.code as department_code'
    )
    .where('s.user_id', userId)
    .first();
}

export async function findStudentByUserId(userId) {
  return db('students').where({ user_id: userId }).first();
}

export async function findSectionById(sectionId) {
  return db('sections as s')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id')
    .select(
      's.id',
      's.course_id',
      's.capacity',
      's.academic_term_id',
      's.is_active',
      't.is_active as term_is_active'
    )
    .where('s.id', sectionId)
    .first();
}

export async function countRegisteredInSection(sectionId) {
  const row = await db('enrollments')
    .where({ section_id: sectionId, status: 'registered' })
    .count('* as count')
    .first();

  return Number(row?.count || 0);
}

export async function findEnrollmentByStudentAndSection(studentId, sectionId) {
  return db('enrollments').where({ student_id: studentId, section_id: sectionId }).first();
}

export async function createEnrollment({ studentId, sectionId, academicTermId }) {
  const [created] = await db('enrollments')
    .insert({
      student_id: studentId,
      section_id: sectionId,
      academic_term_id: academicTermId || null,
      status: 'registered',
      registered_at: db.fn.now(),
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(['id', 'student_id', 'section_id', 'academic_term_id', 'status', 'registered_at']);

  return created;
}

export async function findEnrollmentByIdAndUserId(enrollmentId, userId) {
  return db('enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .where('e.id', enrollmentId)
    .andWhere('s.user_id', userId)
    .select('e.*', 's.id as student_id')
    .first();
}

export async function markEnrollmentDropped(enrollmentId) {
  const [updated] = await db('enrollments')
    .where({ id: enrollmentId })
    .update({
      status: 'dropped',
      dropped_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(['id', 'student_id', 'section_id', 'academic_term_id', 'status', 'registered_at', 'dropped_at']);

  return updated;
}

export async function listPrerequisiteCourseIds(courseId) {
  const rows = await db('course_prerequisites').where({ course_id: courseId }).select('prerequisite_id');
  return rows.map((row) => Number(row.prerequisite_id));
}

export async function countPassedPrerequisites(studentId, prerequisiteCourseIds) {
  if (!prerequisiteCourseIds.length) {
    return 0;
  }

  const rows = await db('enrollments as e')
    .join('sections as s', 's.id', 'e.section_id')
    .leftJoin('grades as g', 'g.enrollment_id', 'e.id')
    .where('e.student_id', studentId)
    .whereIn('s.course_id', prerequisiteCourseIds)
    .andWhere((query) => {
      query.whereIn('e.status', ['completed', 'registered']).orWhere('g.total', '>=', 60);
    })
    .select('s.course_id')
    .groupBy('s.course_id');

  return rows.length;
}

export async function listStudentEnrollmentsByUserId(userId, { status, academicTermId } = {}) {
  const query = db('enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id')
    .join('professors as p', 'p.id', 'sec.professor_id')
    .join('users as pu', 'pu.id', 'p.user_id')
    .select(
      'e.id',
      'e.status',
      'e.registered_at',
      'e.dropped_at',
      'e.academic_term_id',
      'sec.id as section_id',
      'sec.capacity as section_capacity',
      'sec.room as section_room',
      'sec.schedule as section_schedule',
      'c.id as course_id',
      'c.code as course_code',
      'c.name as course_name',
      'c.credit_hours',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester',
      'p.id as professor_id',
      'pu.first_name as professor_first_name',
      'pu.last_name as professor_last_name'
    )
    .where('s.user_id', userId)
    .orderBy('e.id', 'desc');

  if (status) {
    query.andWhere('e.status', status);
  }

  if (academicTermId) {
    query.andWhere('e.academic_term_id', academicTermId);
  }

  return query;
}

export async function listStudentGradesByUserId(userId, { academicTermId } = {}) {
  const query = db('grades as g')
    .join('enrollments as e', 'e.id', 'g.enrollment_id')
    .join('students as s', 's.id', 'e.student_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id')
    .select(
      'g.id',
      'g.enrollment_id',
      'g.midterm',
      'g.final',
      'g.coursework',
      'g.total',
      'g.letter_grade',
      'g.grade_points',
      'g.graded_at',
      'e.status as enrollment_status',
      'e.academic_term_id',
      'c.id as course_id',
      'c.code as course_code',
      'c.name as course_name',
      'c.credit_hours',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester'
    )
    .where('s.user_id', userId)
    .orderBy('g.id', 'desc');

  if (academicTermId) {
    query.andWhere('e.academic_term_id', academicTermId);
  }

  return query;
}

export default {
  findStudentProfileByUserId,
  findStudentByUserId,
  findSectionById,
  countRegisteredInSection,
  findEnrollmentByStudentAndSection,
  createEnrollment,
  findEnrollmentByIdAndUserId,
  markEnrollmentDropped,
  listPrerequisiteCourseIds,
  countPassedPrerequisites,
  listStudentEnrollmentsByUserId,
  listStudentGradesByUserId,
};

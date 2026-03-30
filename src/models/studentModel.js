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
  listStudentEnrollmentsByUserId,
  listStudentGradesByUserId,
};

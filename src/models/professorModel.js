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
    .select('s.id')
    .where('p.user_id', userId)
    .andWhere('s.id', sectionId)
    .first();
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
    .join('students as st', 'st.id', 'e.student_id')
    .join('users as su', 'su.id', 'st.user_id')
    .leftJoin('grades as g', 'g.enrollment_id', 'e.id')
    .select(
      'e.id as enrollment_id',
      'st.id as student_id',
      'st.student_number',
      'su.first_name',
      'su.last_name',
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

export default {
  findProfessorProfileByUserId,
  listProfessorSectionsByUserId,
  findProfessorSectionById,
  listProfessorSectionStudents,
  listProfessorSectionGrades,
};

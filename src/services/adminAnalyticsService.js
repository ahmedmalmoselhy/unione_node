import db from '../config/knex.js';

export async function getRatingsSummary({ academic_term_id: academicTermId } = {}) {
  const query = db('course_ratings as cr')
    .join('enrollments as e', 'e.id', 'cr.enrollment_id')
    .join('sections as s', 's.id', 'e.section_id')
    .join('courses as c', 'c.id', 's.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id')
    .groupBy('c.id', 'c.code', 'c.name', 't.id', 't.name', 't.academic_year', 't.semester')
    .select(
      'c.id as course_id',
      'c.code as course_code',
      'c.name as course_name',
      't.id as academic_term_id',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester',
      db.raw('COUNT(cr.id)::int as rating_count'),
      db.raw('ROUND(AVG(cr.rating)::numeric, 2) as average_rating')
    )
    .orderBy('rating_count', 'desc');

  if (academicTermId) {
    query.andWhere('e.academic_term_id', academicTermId);
  }

  return query;
}

export async function getAttendanceSummary({ academic_term_id: academicTermId } = {}) {
  const query = db('attendance_records as ar')
    .join('attendance_sessions as ses', 'ses.id', 'ar.attendance_session_id')
    .join('sections as s', 's.id', 'ses.section_id')
    .join('courses as c', 'c.id', 's.course_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id')
    .groupBy('s.id', 'c.id', 'c.code', 'c.name', 't.id', 't.name', 't.academic_year', 't.semester')
    .select(
      's.id as section_id',
      'c.id as course_id',
      'c.code as course_code',
      'c.name as course_name',
      't.id as academic_term_id',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester',
      db.raw('COUNT(ar.id)::int as total_records'),
      db.raw("SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END)::int as present_count"),
      db.raw("SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END)::int as absent_count"),
      db.raw("SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END)::int as late_count"),
      db.raw("SUM(CASE WHEN ar.status = 'excused' THEN 1 ELSE 0 END)::int as excused_count")
    )
    .orderBy('section_id', 'asc');

  if (academicTermId) {
    query.andWhere('s.academic_term_id', academicTermId);
  }

  return query;
}

export default {
  getRatingsSummary,
  getAttendanceSummary,
};

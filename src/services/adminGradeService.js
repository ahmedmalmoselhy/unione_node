import db from '../config/knex.js';
import { applyFacultyDepartmentScope, assertStudentInScope, buildAdminScope } from '../utils/adminScope.js';

function baseGradeQuery(connection = db) {
  return connection('grades as g')
    .join('enrollments as e', 'e.id', 'g.enrollment_id')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as su', 'su.id', 's.user_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id')
    .leftJoin('users as gu', 'gu.id', 'g.graded_by')
    .select(
      'g.id',
      'g.enrollment_id',
      'g.midterm',
      'g.final',
      'g.coursework',
      'g.total',
      'g.letter_grade',
      'g.grade_points',
      'g.graded_by',
      'g.graded_at',
      'g.created_at',
      'g.updated_at',
      'e.student_id',
      'e.section_id',
      'e.academic_term_id',
      's.student_number',
      'su.first_name as student_first_name',
      'su.last_name as student_last_name',
      'c.code as course_code',
      'c.name as course_name',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester',
      'gu.first_name as graded_by_first_name',
      'gu.last_name as graded_by_last_name'
    );
}

function applyGradeFilters(query, { search, enrollmentId, studentId, sectionId, academicTermId } = {}) {
  if (search) {
    query.andWhere((builder) => {
      builder
        .whereILike('s.student_number', `%${search}%`)
        .orWhereILike('su.first_name', `%${search}%`)
        .orWhereILike('su.last_name', `%${search}%`)
        .orWhereILike('c.code', `%${search}%`)
        .orWhereILike('c.name', `%${search}%`);
    });
  }

  if (enrollmentId) {
    query.andWhere('g.enrollment_id', enrollmentId);
  }
  if (studentId) {
    query.andWhere('e.student_id', studentId);
  }
  if (sectionId) {
    query.andWhere('e.section_id', sectionId);
  }
  if (academicTermId) {
    query.andWhere('e.academic_term_id', academicTermId);
  }
}

async function assertEnrollment(connection, enrollmentId) {
  const row = await connection('enrollments').where({ id: enrollmentId }).first();
  if (!row) {
    const error = new Error('Enrollment not found');
    error.status = 404;
    throw error;
  }

  return row;
}

async function assertEnrollmentInScope(connection, scope, enrollmentId) {
  const enrollment = await assertEnrollment(connection, enrollmentId);
  await assertStudentInScope(connection, scope, enrollment.student_id);
  return enrollment;
}

export async function listGrades({ search, enrollment_id: enrollmentId, student_id: studentId, section_id: sectionId, academic_term_id: academicTermId, page = 1, limit = 25 } = {}, actor) {
  const scope = buildAdminScope(actor);
  if (studentId) {
    await assertStudentInScope(db, scope, studentId);
  }
  if (enrollmentId) {
    await assertEnrollmentInScope(db, scope, enrollmentId);
  }

  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const rowsQuery = baseGradeQuery();
  applyFacultyDepartmentScope(rowsQuery, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  applyGradeFilters(rowsQuery, { search, enrollmentId, studentId, sectionId, academicTermId });

  const totalQuery = db('grades as g')
    .join('enrollments as e', 'e.id', 'g.enrollment_id')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as su', 'su.id', 's.user_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id');
  applyFacultyDepartmentScope(totalQuery, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  applyGradeFilters(totalQuery, { search, enrollmentId, studentId, sectionId, academicTermId });

  const [rows, totalRow] = await Promise.all([
    rowsQuery.orderBy('g.id', 'desc').limit(safeLimit).offset(offset),
    totalQuery.count('* as count').first(),
  ]);

  return {
    data: rows,
    meta: { page: safePage, limit: safeLimit, total: Number(totalRow?.count || 0) },
  };
}

export async function getGradeById(id, actor, connection = db) {
  const scope = buildAdminScope(actor);
  const query = baseGradeQuery(connection).where('g.id', id);
  applyFacultyDepartmentScope(query, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  return query.first();
}

export async function createGrade(payload, gradedBy, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertEnrollmentInScope(trx, scope, payload.enrollment_id);

    const [grade] = await trx('grades')
      .insert({
        enrollment_id: payload.enrollment_id,
        midterm: payload.midterm ?? null,
        final: payload.final ?? null,
        coursework: payload.coursework ?? null,
        total: payload.total ?? null,
        letter_grade: payload.letter_grade ?? null,
        grade_points: payload.grade_points ?? null,
        graded_by: gradedBy,
        graded_at: payload.graded_at || trx.fn.now(),
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    return getGradeById(grade.id, actor, trx);
  });
}

export async function updateGrade(id, payload, gradedBy, actor) {
  return db.transaction(async (trx) => {
    const current = await trx('grades').where({ id }).first();
    if (!current) {
      return null;
    }

    const scope = buildAdminScope(actor);
    await assertEnrollmentInScope(trx, scope, current.enrollment_id);

    const patch = {};
    for (const key of ['midterm', 'final', 'coursework', 'total', 'letter_grade', 'grade_points', 'graded_at']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }
    patch.graded_by = gradedBy;

    await trx('grades').where({ id }).update({ ...patch, updated_at: trx.fn.now() });
    return getGradeById(id, actor, trx);
  });
}

export async function deleteGrade(id, actor) {
  const scope = buildAdminScope(actor);
  const grade = await db('grades').where({ id }).first();
  if (!grade) {
    return 0;
  }
  await assertEnrollmentInScope(db, scope, grade.enrollment_id);
  return db('grades').where({ id }).del();
}

export default {
  listGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
};
import db from '../config/knex.js';
import { applyFacultyDepartmentScope, assertSectionInScope, assertStudentInScope, buildAdminScope } from '../utils/adminScope.js';

function baseEnrollmentQuery(connection = db) {
  return connection('enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as su', 'su.id', 's.user_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id')
    .select(
      'e.id',
      'e.student_id',
      'e.section_id',
      'e.academic_term_id',
      'e.status',
      'e.registered_at',
      'e.dropped_at',
      'e.created_at',
      'e.updated_at',
      's.student_number',
      'su.first_name as student_first_name',
      'su.last_name as student_last_name',
      'c.code as course_code',
      'c.name as course_name',
      'sec.room as section_room',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester'
    );
}

function applyEnrollmentFilters(query, { search, studentId, sectionId, academicTermId, status } = {}) {
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

  if (studentId) {
    query.andWhere('e.student_id', studentId);
  }
  if (sectionId) {
    query.andWhere('e.section_id', sectionId);
  }
  if (academicTermId) {
    query.andWhere('e.academic_term_id', academicTermId);
  }
  if (status) {
    query.andWhere('e.status', status);
  }
}

async function assertEnrollmentRelations(connection, payload) {
  const [student, section] = await Promise.all([
    connection('students').where({ id: payload.student_id }).first(),
    connection('sections').where({ id: payload.section_id }).first(),
  ]);

  if (!student) {
    const error = new Error('Student not found');
    error.status = 404;
    throw error;
  }
  if (!section) {
    const error = new Error('Section not found');
    error.status = 404;
    throw error;
  }

  if (payload.academic_term_id !== undefined && payload.academic_term_id !== null) {
    const term = await connection('academic_terms').where({ id: payload.academic_term_id }).first();
    if (!term) {
      const error = new Error('Academic term not found');
      error.status = 404;
      throw error;
    }
  }
}

export async function listEnrollments({ search, student_id: studentId, section_id: sectionId, academic_term_id: academicTermId, status, page = 1, limit = 25 } = {}, actor) {
  const scope = buildAdminScope(actor);
  if (studentId) {
    await assertStudentInScope(db, scope, studentId);
  }
  if (sectionId) {
    await assertSectionInScope(db, scope, sectionId);
  }

  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const rowsQuery = baseEnrollmentQuery();
  applyFacultyDepartmentScope(rowsQuery, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  applyEnrollmentFilters(rowsQuery, { search, studentId, sectionId, academicTermId, status });

  const totalQuery = db('enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as su', 'su.id', 's.user_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id');
  applyFacultyDepartmentScope(totalQuery, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  applyEnrollmentFilters(totalQuery, { search, studentId, sectionId, academicTermId, status });

  const [rows, totalRow] = await Promise.all([
    rowsQuery.orderBy('e.id', 'desc').limit(safeLimit).offset(offset),
    totalQuery.count('* as count').first(),
  ]);

  return {
    data: rows,
    meta: { page: safePage, limit: safeLimit, total: Number(totalRow?.count || 0) },
  };
}

export async function getEnrollmentById(id, actor, connection = db) {
  const scope = buildAdminScope(actor);
  const query = baseEnrollmentQuery(connection).where('e.id', id);
  applyFacultyDepartmentScope(query, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  return query.first();
}

export async function createEnrollment(payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertStudentInScope(trx, scope, payload.student_id);
    await assertSectionInScope(trx, scope, payload.section_id);

    await assertEnrollmentRelations(trx, payload);

    const [created] = await trx('enrollments')
      .insert({
        student_id: payload.student_id,
        section_id: payload.section_id,
        academic_term_id: payload.academic_term_id || null,
        status: payload.status || 'registered',
        registered_at: payload.registered_at || trx.fn.now(),
        dropped_at: payload.dropped_at || null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    return getEnrollmentById(created.id, actor, trx);
  });
}

export async function updateEnrollment(id, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const current = await trx('enrollments').where({ id }).first();
    if (!current) {
      return null;
    }

    await assertStudentInScope(trx, scope, current.student_id);
    await assertSectionInScope(trx, scope, current.section_id);

    const relationPayload = {
      student_id: payload.student_id ?? current.student_id,
      section_id: payload.section_id ?? current.section_id,
      academic_term_id: payload.academic_term_id ?? current.academic_term_id,
    };
    await assertStudentInScope(trx, scope, relationPayload.student_id);
    await assertSectionInScope(trx, scope, relationPayload.section_id);
    await assertEnrollmentRelations(trx, relationPayload);

    const patch = {};
    for (const key of ['student_id', 'section_id', 'academic_term_id', 'status', 'registered_at', 'dropped_at']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }

    await trx('enrollments').where({ id }).update({ ...patch, updated_at: trx.fn.now() });
    return getEnrollmentById(id, actor, trx);
  });
}

export async function deleteEnrollment(id, actor) {
  const scope = buildAdminScope(actor);
  const enrollment = await db('enrollments').where({ id }).first();
  if (!enrollment) {
    return 0;
  }
  await assertStudentInScope(db, scope, enrollment.student_id);
  return db('enrollments').where({ id }).del();
}

export default {
  listEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
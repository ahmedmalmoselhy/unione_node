import db from '../config/knex.js';
import { applyCourseScope, assertCourseInScope, assertDepartmentInScope, assertSectionInScope, buildAdminScope } from '../utils/adminScope.js';

function applySectionFilters(query, { search, courseId, professorId, academicTermId, isActive } = {}) {
  if (search) {
    query.andWhere((builder) => {
      builder
        .whereILike('c.code', `%${search}%`)
        .orWhereILike('c.name', `%${search}%`)
        .orWhereILike('pu.first_name', `%${search}%`)
        .orWhereILike('pu.last_name', `%${search}%`)
        .orWhereILike('s.room', `%${search}%`);
    });
  }

  if (courseId) {
    query.andWhere('s.course_id', courseId);
  }

  if (professorId) {
    query.andWhere('s.professor_id', professorId);
  }

  if (academicTermId) {
    query.andWhere('s.academic_term_id', academicTermId);
  }

  if (typeof isActive === 'boolean') {
    query.andWhere('s.is_active', isActive);
  }
}

function baseSectionQuery(connection = db) {
  return connection('sections as s')
    .join('courses as c', 'c.id', 's.course_id')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('users as pu', 'pu.id', 'p.user_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id')
    .select(
      's.id',
      's.course_id',
      's.professor_id',
      's.academic_term_id',
      's.capacity',
      's.room',
      's.schedule',
      's.is_active',
      's.created_at',
      's.updated_at',
      'c.code as course_code',
      'c.name as course_name',
      'pu.first_name as professor_first_name',
      'pu.last_name as professor_last_name',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester'
    );
}

async function assertSectionRelations(connection, payload) {
  const [course, professor] = await Promise.all([
    connection('courses').where({ id: payload.course_id }).first(),
    connection('professors').where({ id: payload.professor_id }).first(),
  ]);

  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  if (!professor) {
    const error = new Error('Professor not found');
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

export async function listSections({ search, course_id: courseId, professor_id: professorId, academic_term_id: academicTermId, is_active: isActive, page = 1, limit = 25 } = {}, actor) {
  const scope = buildAdminScope(actor);
  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  if (courseId) {
    await assertCourseInScope(db, scope, courseId);
  }

  const rowsQuery = baseSectionQuery();
  applyCourseScope(rowsQuery, scope, 's.course_id');
  applySectionFilters(rowsQuery, { search, courseId, professorId, academicTermId, isActive });

  const totalQuery = db('sections as s')
    .join('courses as c', 'c.id', 's.course_id')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('users as pu', 'pu.id', 'p.user_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id');
  applyCourseScope(totalQuery, scope, 's.course_id');
  applySectionFilters(totalQuery, { search, courseId, professorId, academicTermId, isActive });

  const [rows, totalRow] = await Promise.all([
    rowsQuery.orderBy('s.id', 'desc').limit(safeLimit).offset(offset),
    totalQuery.count('* as count').first(),
  ]);

  return {
    data: rows,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: Number(totalRow?.count || 0),
    },
  };
}

export async function getSectionById(id, actor, connection = db) {
  const scope = buildAdminScope(actor);
  await assertSectionInScope(connection, scope, id);
  return baseSectionQuery(connection).where('s.id', id).first();
}

export async function createSection(payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertCourseInScope(trx, scope, payload.course_id);

    const professor = await trx('professors').where({ id: payload.professor_id }).first();
    if (professor?.department_id) {
      await assertDepartmentInScope(trx, scope, professor.department_id);
    }

    await assertSectionRelations(trx, payload);

    const [created] = await trx('sections')
      .insert({
        course_id: payload.course_id,
        professor_id: payload.professor_id,
        academic_term_id: payload.academic_term_id || null,
        capacity: payload.capacity,
        room: payload.room || null,
        schedule: payload.schedule || null,
        is_active: payload.is_active ?? true,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    return getSectionById(created.id, actor, trx);
  });
}

export async function updateSection(id, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const current = await trx('sections').where({ id }).first();
    if (!current) {
      return null;
    }
    await assertSectionInScope(trx, scope, id);

    const relationPayload = {
      course_id: payload.course_id ?? current.course_id,
      professor_id: payload.professor_id ?? current.professor_id,
      academic_term_id: payload.academic_term_id ?? current.academic_term_id,
    };
    await assertCourseInScope(trx, scope, relationPayload.course_id);

    const professor = await trx('professors').where({ id: relationPayload.professor_id }).first();
    if (professor?.department_id) {
      await assertDepartmentInScope(trx, scope, professor.department_id);
    }

    await assertSectionRelations(trx, relationPayload);

    const patch = {};
    for (const key of ['course_id', 'professor_id', 'academic_term_id', 'capacity', 'room', 'schedule', 'is_active']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }

    await trx('sections').where({ id }).update({ ...patch, updated_at: trx.fn.now() });
    return getSectionById(id, actor, trx);
  });
}

export async function deleteSection(id, actor) {
  const scope = buildAdminScope(actor);
  await assertSectionInScope(db, scope, id);
  return db('sections').where({ id }).del();
}

function baseSectionTeachingAssistantQuery(connection = db) {
  return connection('section_teaching_assistants as sta')
    .join('professors as p', 'p.id', 'sta.professor_id')
    .join('users as u', 'u.id', 'p.user_id')
    .select(
      'sta.id',
      'sta.section_id',
      'sta.professor_id',
      'sta.assigned_by_user_id',
      'sta.created_at',
      'sta.updated_at',
      'p.staff_number',
      'u.first_name',
      'u.last_name'
    );
}

export async function listSectionTeachingAssistants(sectionId, actor) {
  const scope = buildAdminScope(actor);
  await assertSectionInScope(db, scope, sectionId);

  return baseSectionTeachingAssistantQuery(db)
    .where('sta.section_id', Number(sectionId))
    .orderBy('sta.id', 'asc');
}

export async function assignSectionTeachingAssistant(sectionId, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedProfessorId = Number(payload.professor_id);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const professor = await trx('professors').where({ id: normalizedProfessorId }).first();
    if (!professor) {
      const error = new Error('Professor not found');
      error.status = 404;
      throw error;
    }

    if (professor.department_id) {
      await assertDepartmentInScope(trx, scope, professor.department_id);
    }

    const existing = await baseSectionTeachingAssistantQuery(trx)
      .where('sta.section_id', normalizedSectionId)
      .andWhere('sta.professor_id', normalizedProfessorId)
      .first();

    if (existing) {
      return { assignment: existing, created: false };
    }

    const [created] = await trx('section_teaching_assistants')
      .insert({
        section_id: normalizedSectionId,
        professor_id: normalizedProfessorId,
        assigned_by_user_id: actor?.id || null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('id');

    const assignment = await baseSectionTeachingAssistantQuery(trx)
      .where('sta.id', created.id)
      .first();

    return { assignment, created: true };
  });
}

export async function removeSectionTeachingAssistant(sectionId, taId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const normalizedSectionId = Number(sectionId);
    const normalizedTaId = Number(taId);

    await assertSectionInScope(trx, scope, normalizedSectionId);

    const existing = await trx('section_teaching_assistants')
      .where({ id: normalizedTaId, section_id: normalizedSectionId })
      .first();

    if (!existing) {
      return false;
    }

    await trx('section_teaching_assistants')
      .where({ id: normalizedTaId, section_id: normalizedSectionId })
      .del();

    return true;
  });
}

export default {
  listSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  listSectionTeachingAssistants,
  assignSectionTeachingAssistant,
  removeSectionTeachingAssistant,
};
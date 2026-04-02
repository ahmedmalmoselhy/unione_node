import db from '../config/knex.js';

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

export async function listSections({ search, course_id: courseId, professor_id: professorId, academic_term_id: academicTermId, is_active: isActive, page = 1, limit = 25 } = {}) {
  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const rowsQuery = baseSectionQuery();
  applySectionFilters(rowsQuery, { search, courseId, professorId, academicTermId, isActive });

  const totalQuery = db('sections as s')
    .join('courses as c', 'c.id', 's.course_id')
    .join('professors as p', 'p.id', 's.professor_id')
    .join('users as pu', 'pu.id', 'p.user_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id');
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

export async function getSectionById(id, connection = db) {
  return baseSectionQuery(connection).where('s.id', id).first();
}

export async function createSection(payload) {
  return db.transaction(async (trx) => {
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

    return getSectionById(created.id, trx);
  });
}

export async function updateSection(id, payload) {
  return db.transaction(async (trx) => {
    const current = await trx('sections').where({ id }).first();
    if (!current) {
      return null;
    }

    const relationPayload = {
      course_id: payload.course_id ?? current.course_id,
      professor_id: payload.professor_id ?? current.professor_id,
      academic_term_id: payload.academic_term_id ?? current.academic_term_id,
    };
    await assertSectionRelations(trx, relationPayload);

    const patch = {};
    for (const key of ['course_id', 'professor_id', 'academic_term_id', 'capacity', 'room', 'schedule', 'is_active']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }

    await trx('sections').where({ id }).update({ ...patch, updated_at: trx.fn.now() });
    return getSectionById(id, trx);
  });
}

export async function deleteSection(id) {
  return db('sections').where({ id }).del();
}

export default {
  listSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
};
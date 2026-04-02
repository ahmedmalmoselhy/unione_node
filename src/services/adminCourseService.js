import db from '../config/knex.js';

function applyCourseFilters(query, { search, departmentId, isActive, isElective, level } = {}) {
  if (search) {
    query.andWhere((builder) => {
      builder.whereILike('c.code', `%${search}%`).orWhereILike('c.name', `%${search}%`).orWhereILike('c.name_ar', `%${search}%`);
    });
  }

  if (departmentId) {
    query.whereExists(function whereDepartment() {
      this.select(db.raw('1')).from('department_course as dc').whereRaw('dc.course_id = c.id').andWhere('dc.department_id', departmentId);
    });
  }

  if (typeof isActive === 'boolean') {
    query.andWhere('c.is_active', isActive);
  }

  if (typeof isElective === 'boolean') {
    query.andWhere('c.is_elective', isElective);
  }

  if (level) {
    query.andWhere('c.level', level);
  }
}

async function attachCourseDepartments(connection, courseRows) {
  if (!courseRows.length) {
    return [];
  }

  const courseIds = courseRows.map((row) => row.id);
  const departments = await connection('department_course as dc')
    .join('departments as d', 'd.id', 'dc.department_id')
    .whereIn('dc.course_id', courseIds)
    .select('dc.course_id', 'dc.department_id', 'dc.is_owner', 'd.name as department_name', 'd.code as department_code', 'd.faculty_id');

  const byCourse = departments.reduce((acc, item) => {
    const key = Number(item.course_id);
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key).push(item);
    return acc;
  }, new Map());

  return courseRows.map((course) => ({
    ...course,
    departments: byCourse.get(Number(course.id)) || [],
  }));
}

export async function listCourses({ search, department_id: departmentId, is_active: isActive, is_elective: isElective, level, page = 1, limit = 25 } = {}) {
  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const rowsQuery = db('courses as c').select(
    'c.id',
    'c.code',
    'c.name',
    'c.name_ar',
    'c.description',
    'c.credit_hours',
    'c.lecture_hours',
    'c.lab_hours',
    'c.level',
    'c.is_elective',
    'c.is_active',
    'c.created_at',
    'c.updated_at'
  );
  applyCourseFilters(rowsQuery, { search, departmentId, isActive, isElective, level });

  const totalQuery = db('courses as c');
  applyCourseFilters(totalQuery, { search, departmentId, isActive, isElective, level });

  const [rows, totalRow] = await Promise.all([
    rowsQuery.orderBy('c.id', 'desc').limit(safeLimit).offset(offset),
    totalQuery.count('* as count').first(),
  ]);

  return {
    data: await attachCourseDepartments(db, rows),
    meta: {
      page: safePage,
      limit: safeLimit,
      total: Number(totalRow?.count || 0),
    },
  };
}

async function getCourseBaseById(connection, id) {
  return connection('courses as c')
    .select(
      'c.id',
      'c.code',
      'c.name',
      'c.name_ar',
      'c.description',
      'c.credit_hours',
      'c.lecture_hours',
      'c.lab_hours',
      'c.level',
      'c.is_elective',
      'c.is_active',
      'c.created_at',
      'c.updated_at'
    )
    .where('c.id', id)
    .first();
}

export async function getCourseById(id, connection = db) {
  const course = await getCourseBaseById(connection, id);
  if (!course) {
    return null;
  }

  const [withDepartments] = await attachCourseDepartments(connection, [course]);
  return withDepartments;
}

async function validateCourseDepartments(connection, departmentIds) {
  const rows = await connection('departments').whereIn('id', departmentIds).select('id');
  if (rows.length !== departmentIds.length) {
    const error = new Error('One or more departments were not found');
    error.status = 404;
    throw error;
  }
}

async function syncCourseDepartments(connection, courseId, departmentIds, ownerDepartmentId = null) {
  const normalized = [...new Set(departmentIds.map((id) => Number(id)))];
  await validateCourseDepartments(connection, normalized);

  let owner = ownerDepartmentId ? Number(ownerDepartmentId) : normalized[0];
  if (!normalized.includes(owner)) {
    const error = new Error('owner_department_id must be included in department_ids');
    error.status = 400;
    throw error;
  }

  await connection('department_course').where({ course_id: courseId }).del();
  await connection('department_course').insert(
    normalized.map((departmentId) => ({
      course_id: courseId,
      department_id: departmentId,
      is_owner: departmentId === owner,
    }))
  );
}

export async function createCourse(payload) {
  return db.transaction(async (trx) => {
    const [created] = await trx('courses')
      .insert({
        code: payload.code,
        name: payload.name,
        name_ar: payload.name_ar,
        description: payload.description || null,
        credit_hours: payload.credit_hours,
        lecture_hours: payload.lecture_hours,
        lab_hours: payload.lab_hours ?? 0,
        level: payload.level,
        is_elective: payload.is_elective ?? false,
        is_active: payload.is_active ?? true,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    await syncCourseDepartments(trx, created.id, payload.department_ids, payload.owner_department_id || null);
    return getCourseById(created.id, trx);
  });
}

export async function updateCourse(id, payload) {
  return db.transaction(async (trx) => {
    const current = await getCourseBaseById(trx, id);
    if (!current) {
      return null;
    }

    const patch = {};
    for (const key of ['code', 'name', 'name_ar', 'description', 'credit_hours', 'lecture_hours', 'lab_hours', 'level', 'is_elective', 'is_active']) {
      if (payload[key] !== undefined) {
        patch[key] = payload[key];
      }
    }

    if (Object.keys(patch).length > 0) {
      await trx('courses').where({ id }).update({ ...patch, updated_at: trx.fn.now() });
    }

    if (payload.department_ids) {
      await syncCourseDepartments(trx, id, payload.department_ids, payload.owner_department_id);
    }

    return getCourseById(id, trx);
  });
}

export async function deleteCourse(id) {
  return db('courses').where({ id }).del();
}

export default {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
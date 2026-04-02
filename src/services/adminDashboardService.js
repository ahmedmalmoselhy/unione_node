import db from '../config/knex.js';

function applyStudentScope(query, facultyId, departmentId) {
  return query
    .when(facultyId, (builder) => builder.where('s.faculty_id', facultyId))
    .when(departmentId, (builder) => builder.where('s.department_id', departmentId));
}

function applyCourseScope(query, facultyId, departmentId) {
  return query
    .when(facultyId, (builder) => builder.whereExists(function whereExistsFaculty() {
      this.select(db.raw('1'))
        .from('department_course as dc')
        .join('departments as d', 'd.id', 'dc.department_id')
        .whereRaw('dc.course_id = c.id')
        .andWhere('d.faculty_id', facultyId);
    }))
    .when(departmentId, (builder) => builder.whereExists(function whereExistsDepartment() {
      this.select(db.raw('1'))
        .from('department_course as dc')
        .whereRaw('dc.course_id = c.id')
        .andWhere('dc.department_id', departmentId);
    }));
}

function applySectionScope(query, facultyId, departmentId) {
  return query
    .when(facultyId, (builder) => builder.whereExists(function whereExistsFaculty() {
      this.select(db.raw('1'))
        .from('courses as c')
        .join('department_course as dc', 'dc.course_id', 'c.id')
        .join('departments as d', 'd.id', 'dc.department_id')
        .whereRaw('c.id = s.course_id')
        .andWhere('d.faculty_id', facultyId);
    }))
    .when(departmentId, (builder) => builder.whereExists(function whereExistsDepartment() {
      this.select(db.raw('1'))
        .from('courses as c')
        .join('department_course as dc', 'dc.course_id', 'c.id')
        .whereRaw('c.id = s.course_id')
        .andWhere('dc.department_id', departmentId);
    }));
}

export async function getDashboardStats({ faculty_id: facultyId, department_id: departmentId } = {}) {
  const studentsQuery = applyStudentScope(db('students as s'), facultyId, departmentId);
  const professorsQuery = db('professors as p')
    .join('departments as d', 'd.id', 'p.department_id')
    .when(facultyId, (builder) => builder.where('d.faculty_id', facultyId))
    .when(departmentId, (builder) => builder.where('p.department_id', departmentId));

  const coursesQuery = applyCourseScope(db('courses as c'), facultyId, departmentId);
  const sectionsQuery = applySectionScope(db('sections as s'), facultyId, departmentId);

  const [students, professors, courses, sections] = await Promise.all([
    studentsQuery.count('* as count').first(),
    professorsQuery.count('* as count').first(),
    coursesQuery.countDistinct({ count: 'c.id' }).first(),
    sectionsQuery.count('* as count').first(),
  ]);

  const enrollmentStatusRows = await applyStudentScope(db('students as s'), facultyId, departmentId)
    .select('s.enrollment_status')
    .count('* as count')
    .groupBy('s.enrollment_status');

  const gradeRows = await db('grades as g')
    .join('enrollments as e', 'e.id', 'g.enrollment_id')
    .join('students as s', 's.id', 'e.student_id')
    .when(facultyId, (builder) => builder.where('s.faculty_id', facultyId))
    .when(departmentId, (builder) => builder.where('s.department_id', departmentId))
    .whereNotNull('g.letter_grade')
    .select('g.letter_grade')
    .count('* as count')
    .groupBy('g.letter_grade')
    .orderBy('g.letter_grade');

  const gpaRows = await applyStudentScope(db('students as s'), facultyId, departmentId)
    .whereNotNull('s.gpa')
    .select('s.gpa');

  const brackets = {
    '0.0-1.99': 0,
    '2.0-2.49': 0,
    '2.5-2.99': 0,
    '3.0-3.49': 0,
    '3.5-4.0': 0,
  };

  for (const row of gpaRows) {
    const gpa = Number(row.gpa);
    if (gpa < 2.0) {
      brackets['0.0-1.99'] += 1;
    } else if (gpa < 2.5) {
      brackets['2.0-2.49'] += 1;
    } else if (gpa < 3.0) {
      brackets['2.5-2.99'] += 1;
    } else if (gpa < 3.5) {
      brackets['3.0-3.49'] += 1;
    } else {
      brackets['3.5-4.0'] += 1;
    }
  }

  const enrollmentRates = await applySectionScope(
    db('sections as s')
      .leftJoin('academic_terms as t', 't.id', 's.academic_term_id')
      .where('t.is_active', true),
    facultyId,
    departmentId
  )
    .select(
      's.id as section_id',
      's.capacity',
      's.course_id',
      's.room',
      db.raw("(select count(*) from enrollments e where e.section_id = s.id and e.status in ('registered', 'completed')) as filled_spots")
    )
    .orderBy('s.id', 'asc');

  const courseIds = enrollmentRates.map((row) => row.course_id).filter(Boolean);
  const courseMap = courseIds.length
    ? await db('courses as c').whereIn('c.id', courseIds).select('c.id', 'c.code', 'c.name')
    : [];
  const courseLookup = new Map(courseMap.map((course) => [course.id, course]));

  return {
    overview: {
      students: Number(students?.count || 0),
      professors: Number(professors?.count || 0),
      courses: Number(courses?.count || 0),
      sections: Number(sections?.count || 0),
    },
    enrollment_status: enrollmentStatusRows.reduce((accumulator, row) => {
      accumulator[row.enrollment_status] = Number(row.count || 0);
      return accumulator;
    }, {}),
    grade_distribution: gradeRows.reduce((accumulator, row) => {
      accumulator[row.letter_grade] = Number(row.count || 0);
      return accumulator;
    }, {}),
    gpa_distribution: brackets,
    enrollment_rates: enrollmentRates.map((row) => {
      const course = courseLookup.get(row.course_id);
      return {
        section_id: row.section_id,
        course_code: course?.code || null,
        course_name: course?.name || null,
        capacity: Number(row.capacity || 0),
        filled: Number(row.filled_spots || 0),
        fill_pct: Number(row.capacity || 0) > 0 ? Number(((Number(row.filled_spots || 0) / Number(row.capacity || 0)) * 100).toFixed(1)) : 0,
      };
    }),
  };
}

export async function listAuditLogs({ action, auditable_type: auditableType, search, from_date: fromDate, to_date: toDate, limit = 50, page = 1 } = {}) {
  const query = db('audit_logs as al')
    .leftJoin('users as u', 'u.id', 'al.user_id')
    .select(
      'al.id',
      'al.user_id',
      'u.first_name as user_first_name',
      'u.last_name as user_last_name',
      'u.email as user_email',
      'al.action',
      'al.auditable_type',
      'al.auditable_id',
      'al.description',
      'al.old_values',
      'al.new_values',
      'al.ip_address',
      'al.created_at'
    )
    .orderBy('al.created_at', 'desc');

  if (action) {
    query.andWhere('al.action', action);
  }

  if (auditableType) {
    query.andWhere('al.auditable_type', auditableType);
  }

  if (search) {
    query.andWhere((builder) => {
      builder.whereILike('al.description', `%${search}%`).orWhereILike('al.auditable_type', `%${search}%`);
    });
  }

  if (fromDate) {
    query.andWhere('al.created_at', '>=', fromDate);
  }

  if (toDate) {
    query.andWhere('al.created_at', '<=', toDate);
  }

  const safeLimit = Math.min(Number(limit) || 50, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const totalQuery = db('audit_logs as al');
  if (action) {
    totalQuery.andWhere('al.action', action);
  }
  if (auditableType) {
    totalQuery.andWhere('al.auditable_type', auditableType);
  }
  if (search) {
    totalQuery.andWhere((builder) => {
      builder.whereILike('al.description', `%${search}%`).orWhereILike('al.auditable_type', `%${search}%`);
    });
  }
  if (fromDate) {
    totalQuery.andWhere('al.created_at', '>=', fromDate);
  }
  if (toDate) {
    totalQuery.andWhere('al.created_at', '<=', toDate);
  }

  const [totalRow, logs] = await Promise.all([
    totalQuery.count('* as count').first(),
    query.limit(safeLimit).offset(offset),
  ]);

  return {
    data: logs,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: Number(totalRow?.count || 0),
    },
  };
}
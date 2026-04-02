import db from '../config/knex.js';

const GLOBAL_ROLES = new Set(['admin', 'university_admin']);

function toNumberSet(values) {
  return new Set(
    values
      .filter((value) => value !== null && value !== undefined)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
  );
}

function forbidden(message = 'Forbidden: insufficient scope for this action') {
  const error = new Error(message);
  error.status = 403;
  return error;
}

export function buildAdminScope(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const roleNames = new Set(roles.map((role) => role.name));
  const isGlobal = [...roleNames].some((roleName) => GLOBAL_ROLES.has(roleName));

  return {
    isGlobal,
    facultyIds: toNumberSet(roles.map((role) => role.faculty_id)),
    departmentIds: toNumberSet(roles.map((role) => role.department_id)),
  };
}

export function applyFacultyDepartmentScope(query, scope, { facultyColumn, departmentColumn }) {
  if (scope.isGlobal) {
    return;
  }

  const facultyIds = [...scope.facultyIds];
  const departmentIds = [...scope.departmentIds];

  if (facultyIds.length === 0 && departmentIds.length === 0) {
    throw forbidden();
  }

  query.andWhere((builder) => {
    if (facultyIds.length > 0) {
      builder.whereIn(facultyColumn, facultyIds);
    }

    if (departmentIds.length > 0) {
      if (facultyIds.length > 0) {
        builder.orWhereIn(departmentColumn, departmentIds);
      } else {
        builder.whereIn(departmentColumn, departmentIds);
      }
    }
  });
}

export function assertFacultyInScope(scope, facultyId) {
  const normalizedFacultyId = Number(facultyId);
  if (scope.isGlobal) {
    return;
  }

  if (!scope.facultyIds.has(normalizedFacultyId)) {
    throw forbidden('Forbidden: insufficient scope for this faculty');
  }
}

export async function assertDepartmentInScope(connection = db, scope, departmentId) {
  const normalizedDepartmentId = Number(departmentId);
  const department = await connection('departments').where({ id: normalizedDepartmentId }).first();
  if (!department) {
    const error = new Error('Department not found');
    error.status = 404;
    throw error;
  }

  if (scope.isGlobal) {
    return department;
  }

  if (scope.departmentIds.has(normalizedDepartmentId) || scope.facultyIds.has(Number(department.faculty_id))) {
    return department;
  }

  throw forbidden('Forbidden: insufficient scope for this department');
}

export async function assertCourseInScope(connection = db, scope, courseId) {
  const normalizedCourseId = Number(courseId);
  const course = await connection('courses').where({ id: normalizedCourseId }).first();
  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  if (scope.isGlobal) {
    return course;
  }

  const facultyIds = [...scope.facultyIds];
  const departmentIds = [...scope.departmentIds];

  const row = await connection('department_course as dc')
    .join('departments as d', 'd.id', 'dc.department_id')
    .where('dc.course_id', normalizedCourseId)
    .andWhere((builder) => {
      if (facultyIds.length > 0) {
        builder.whereIn('d.faculty_id', facultyIds);
      }
      if (departmentIds.length > 0) {
        if (facultyIds.length > 0) {
          builder.orWhereIn('dc.department_id', departmentIds);
        } else {
          builder.whereIn('dc.department_id', departmentIds);
        }
      }
    })
    .first('dc.course_id');

  if (!row) {
    throw forbidden('Forbidden: insufficient scope for this course');
  }

  return course;
}

export function applyCourseScope(query, scope, courseIdExpression = 'c.id') {
  if (scope.isGlobal) {
    return;
  }

  const facultyIds = [...scope.facultyIds];
  const departmentIds = [...scope.departmentIds];
  if (facultyIds.length === 0 && departmentIds.length === 0) {
    throw forbidden();
  }

  query.whereExists(function whereCourseScope() {
    this.select(db.raw('1'))
      .from('department_course as dc')
      .join('departments as d', 'd.id', 'dc.department_id')
      .whereRaw(`dc.course_id = ${courseIdExpression}`)
      .andWhere((builder) => {
        if (facultyIds.length > 0) {
          builder.whereIn('d.faculty_id', facultyIds);
        }
        if (departmentIds.length > 0) {
          if (facultyIds.length > 0) {
            builder.orWhereIn('dc.department_id', departmentIds);
          } else {
            builder.whereIn('dc.department_id', departmentIds);
          }
        }
      });
  });
}

export async function assertSectionInScope(connection = db, scope, sectionId) {
  const section = await connection('sections').where({ id: Number(sectionId) }).first();
  if (!section) {
    const error = new Error('Section not found');
    error.status = 404;
    throw error;
  }

  await assertCourseInScope(connection, scope, section.course_id);
  return section;
}

export async function assertStudentInScope(connection = db, scope, studentId) {
  const student = await connection('students').where({ id: Number(studentId) }).first();
  if (!student) {
    const error = new Error('Student not found');
    error.status = 404;
    throw error;
  }

  if (scope.isGlobal) {
    return student;
  }

  if (scope.departmentIds.has(Number(student.department_id)) || scope.facultyIds.has(Number(student.faculty_id))) {
    return student;
  }

  throw forbidden('Forbidden: insufficient scope for this student');
}

export async function assertEmployeeInScope(connection = db, scope, employeeId) {
  const employee = await connection('employees as e')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .where('e.id', Number(employeeId))
    .select('e.id', 'e.department_id', 'd.faculty_id')
    .first();

  if (!employee) {
    const error = new Error('Employee not found');
    error.status = 404;
    throw error;
  }

  if (scope.isGlobal) {
    return employee;
  }

  if (scope.departmentIds.has(Number(employee.department_id)) || scope.facultyIds.has(Number(employee.faculty_id))) {
    return employee;
  }

  throw forbidden('Forbidden: insufficient scope for this employee');
}

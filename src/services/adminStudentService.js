import db from '../config/knex.js';
import { hashPassword } from '../utils/password.js';
import { buildAdminScope, applyFacultyDepartmentScope, assertDepartmentInScope, assertFacultyInScope, assertStudentInScope } from '../utils/adminScope.js';

function baseStudentQuery(connection = db) {
  return connection('students as s')
    .join('users as u', 'u.id', 's.user_id')
    .leftJoin('faculties as f', 'f.id', 's.faculty_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .select(
      's.id as student_id',
      's.user_id',
      's.student_number',
      's.faculty_id',
      's.department_id',
      's.academic_year',
      's.semester',
      's.enrollment_status',
      's.gpa',
      's.academic_standing',
      's.enrolled_at',
      's.graduated_at',
      's.created_at as student_created_at',
      's.updated_at as student_updated_at',
      'u.national_id',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.phone',
      'u.gender',
      'u.date_of_birth',
      'u.avatar_path',
      'u.is_active',
      'f.name as faculty_name',
      'f.code as faculty_code',
      'd.name as department_name',
      'd.code as department_code'
    );
}

function applyStudentFilters(query, { search, facultyId, departmentId, enrollmentStatus, isActive } = {}) {
  if (search) {
    query.andWhere((builder) => {
      builder
        .whereILike('u.first_name', `%${search}%`)
        .orWhereILike('u.last_name', `%${search}%`)
        .orWhereILike('u.email', `%${search}%`)
        .orWhereILike('s.student_number', `%${search}%`);
    });
  }

  if (facultyId) {
    query.andWhere('s.faculty_id', facultyId);
  }

  if (departmentId) {
    query.andWhere('s.department_id', departmentId);
  }

  if (enrollmentStatus) {
    query.andWhere('s.enrollment_status', enrollmentStatus);
  }

  if (typeof isActive === 'boolean') {
    query.andWhere('u.is_active', isActive);
  }
}

async function assertAcademicLinks(connection, facultyId, departmentId = null) {
  const faculty = await connection('faculties').where({ id: facultyId }).first();
  if (!faculty) {
    const error = new Error('Faculty not found');
    error.status = 404;
    throw error;
  }

  if (departmentId) {
    const department = await connection('departments').where({ id: departmentId, faculty_id: facultyId }).first();
    if (!department) {
      const error = new Error('Department not found in selected faculty');
      error.status = 404;
      throw error;
    }
  }
}

async function assertUniqueStudentData(connection, payload, studentId = null, userId = null) {
  if (payload.national_id) {
    const row = await connection('users').whereRaw('LOWER(national_id) = LOWER(?)', [payload.national_id]).first();
    if (row && row.id !== userId) {
      const error = new Error('National ID already exists');
      error.status = 409;
      throw error;
    }
  }

  if (payload.email) {
    const row = await connection('users').whereRaw('LOWER(email) = LOWER(?)', [payload.email]).first();
    if (row && row.id !== userId) {
      const error = new Error('Email already exists');
      error.status = 409;
      throw error;
    }
  }

  if (payload.student_number) {
    const row = await connection('students').whereRaw('LOWER(student_number) = LOWER(?)', [payload.student_number]).first();
    if (row && row.id !== studentId) {
      const error = new Error('Student number already exists');
      error.status = 409;
      throw error;
    }
  }
}

async function ensureStudentRole(connection, userId, facultyId, departmentId) {
  const role = await connection('roles').whereRaw('LOWER(name) = LOWER(?)', ['student']).first();
  if (!role) {
    throw new Error('Student role not configured');
  }

  const existing = await connection('role_user').where({ user_id: userId, role_id: role.id }).orderBy('id', 'desc').first();
  if (existing) {
    await connection('role_user').where({ id: existing.id }).update({
      revoked_at: null,
      granted_at: connection.fn.now(),
      faculty_id: facultyId,
      department_id: departmentId || null,
    });
    return;
  }

  await connection('role_user').insert({
    user_id: userId,
    role_id: role.id,
    faculty_id: facultyId,
    department_id: departmentId || null,
    granted_at: connection.fn.now(),
    revoked_at: null,
  });
}

export async function listStudents({ search, faculty_id: facultyId, department_id: departmentId, enrollment_status: enrollmentStatus, is_active: isActive, page = 1, limit = 25 } = {}, actor) {
  const scope = buildAdminScope(actor);
  if (facultyId) {
    assertFacultyInScope(scope, facultyId);
  }
  if (departmentId) {
    await assertDepartmentInScope(db, scope, departmentId);
  }

  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const rowsQuery = baseStudentQuery();
  applyFacultyDepartmentScope(rowsQuery, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  applyStudentFilters(rowsQuery, { search, facultyId, departmentId, enrollmentStatus, isActive });

  const totalQuery = db('students as s')
    .join('users as u', 'u.id', 's.user_id')
    .leftJoin('faculties as f', 'f.id', 's.faculty_id')
    .leftJoin('departments as d', 'd.id', 's.department_id');
  applyFacultyDepartmentScope(totalQuery, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  applyStudentFilters(totalQuery, { search, facultyId, departmentId, enrollmentStatus, isActive });

  const [rows, totalRow] = await Promise.all([
    rowsQuery.orderBy('s.id', 'desc').limit(safeLimit).offset(offset),
    totalQuery.count('* as count').first(),
  ]);

  return {
    data: rows,
    meta: { page: safePage, limit: safeLimit, total: Number(totalRow?.count || 0) },
  };
}

export async function getStudentById(id, actor, connection = db) {
  const scope = buildAdminScope(actor);
  const query = baseStudentQuery(connection).where('s.id', id);
  applyFacultyDepartmentScope(query, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
  return query.first();
}

export async function createStudent(payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    assertFacultyInScope(scope, payload.faculty_id);
    if (payload.department_id) {
      await assertDepartmentInScope(trx, scope, payload.department_id);
    }

    await assertUniqueStudentData(trx, payload);
    await assertAcademicLinks(trx, payload.faculty_id, payload.department_id || null);

    const passwordHash = await hashPassword(payload.password);
    const [user] = await trx('users')
      .insert({
        national_id: payload.national_id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        password: passwordHash,
        phone: payload.phone || null,
        gender: payload.gender,
        date_of_birth: payload.date_of_birth || null,
        avatar_path: payload.avatar_path || null,
        is_active: payload.is_active ?? true,
        must_change_password: true,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    const [student] = await trx('students')
      .insert({
        user_id: user.id,
        student_number: payload.student_number,
        faculty_id: payload.faculty_id,
        department_id: payload.department_id || null,
        academic_year: payload.academic_year ?? 1,
        semester: payload.semester ?? 'first',
        enrollment_status: payload.enrollment_status ?? 'active',
        gpa: payload.gpa ?? null,
        academic_standing: payload.academic_standing ?? null,
        enrolled_at: payload.enrolled_at,
        graduated_at: payload.graduated_at || null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    await ensureStudentRole(trx, user.id, payload.faculty_id, payload.department_id || null);

    return getStudentById(student.id, actor, trx);
  });
}

export async function updateStudent(id, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const currentQuery = trx('students as s').join('users as u', 'u.id', 's.user_id').where('s.id', id).select('s.id as student_id', 's.user_id', 's.faculty_id', 's.department_id');
    applyFacultyDepartmentScope(currentQuery, scope, { facultyColumn: 's.faculty_id', departmentColumn: 's.department_id' });
    const current = await currentQuery.first();
    if (!current) {
      return null;
    }

    const targetFacultyId = payload.faculty_id ?? current.faculty_id;
    const targetDepartmentId = payload.department_id ?? current.department_id;
    assertFacultyInScope(scope, targetFacultyId);
    if (targetDepartmentId) {
      await assertDepartmentInScope(trx, scope, targetDepartmentId);
    }

    await assertUniqueStudentData(trx, payload, current.student_id, current.user_id);
    await assertAcademicLinks(trx, targetFacultyId, targetDepartmentId);

    const userPatch = {};
    const studentPatch = {};

    for (const key of ['national_id', 'first_name', 'last_name', 'email', 'phone', 'gender', 'date_of_birth', 'avatar_path', 'is_active']) {
      if (payload[key] !== undefined) {
        userPatch[key] = payload[key];
      }
    }

    if (payload.password) {
      userPatch.password = await hashPassword(payload.password);
      userPatch.must_change_password = false;
    }

    for (const key of ['student_number', 'faculty_id', 'department_id', 'academic_year', 'semester', 'enrollment_status', 'gpa', 'academic_standing', 'enrolled_at', 'graduated_at']) {
      if (payload[key] !== undefined) {
        studentPatch[key] = payload[key];
      }
    }

    if (Object.keys(userPatch).length > 0) {
      await trx('users').where({ id: current.user_id }).update({ ...userPatch, updated_at: trx.fn.now() });
    }

    if (Object.keys(studentPatch).length > 0) {
      await trx('students').where({ id }).update({ ...studentPatch, updated_at: trx.fn.now() });
    }

    const nextFacultyId = targetFacultyId;
    const nextDepartmentId = targetDepartmentId;
    await ensureStudentRole(trx, current.user_id, nextFacultyId, nextDepartmentId);

    return getStudentById(id, actor, trx);
  });
}

export async function transferStudent(id, toDepartmentId, switchedBy, note = null, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const current = await assertStudentInScope(trx, scope, id);
    if (!current) {
      return null;
    }

    const targetDepartment = await assertDepartmentInScope(trx, scope, toDepartmentId);

    await trx('student_department_history').insert({
      student_id: id,
      from_department_id: current.department_id,
      to_department_id: toDepartmentId,
      switched_at: trx.fn.now(),
      switched_by: switchedBy,
      note: note || null,
    });

    await trx('students').where({ id }).update({
      faculty_id: targetDepartment.faculty_id,
      department_id: toDepartmentId,
      updated_at: trx.fn.now(),
    });

    await ensureStudentRole(trx, current.user_id, targetDepartment.faculty_id, toDepartmentId);
    return getStudentById(id, actor, trx);
  });
}

export async function deleteStudent(id, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    const student = await assertStudentInScope(trx, scope, id);
    if (!student) {
      return false;
    }

    await trx('students').where({ id }).del();
    return true;
  });
}

export default {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  transferStudent,
  deleteStudent,
};
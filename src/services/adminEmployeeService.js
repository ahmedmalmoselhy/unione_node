import db from '../config/knex.js';
import { hashPassword } from '../utils/password.js';
import { applyFacultyDepartmentScope, assertDepartmentInScope, assertEmployeeInScope, buildAdminScope } from '../utils/adminScope.js';

function baseEmployeeQuery(connection = db) {
  return connection('employees as e')
    .join('users as u', 'u.id', 'e.user_id')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id')
    .select(
      'e.id as employee_id',
      'e.user_id',
      'e.staff_number',
      'e.department_id',
      'e.job_title',
      'e.employment_type',
      'e.salary',
      'e.hired_at',
      'e.terminated_at',
      'e.created_at as employee_created_at',
      'e.updated_at as employee_updated_at',
      'u.national_id',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.phone',
      'u.gender',
      'u.date_of_birth',
      'u.avatar_path',
      'u.is_active',
      'd.name as department_name',
      'd.code as department_code',
      'f.id as faculty_id',
      'f.name as faculty_name'
    );
}

function applyEmployeeFilters(query, { search, departmentId, employmentType, isActive } = {}) {
  if (search) {
    query.andWhere((builder) => {
      builder
        .whereILike('u.first_name', `%${search}%`)
        .orWhereILike('u.last_name', `%${search}%`)
        .orWhereILike('u.email', `%${search}%`)
        .orWhereILike('e.staff_number', `%${search}%`)
        .orWhereILike('e.job_title', `%${search}%`);
    });
  }

  if (departmentId) {
    query.andWhere('e.department_id', departmentId);
  }

  if (employmentType) {
    query.andWhere('e.employment_type', employmentType);
  }

  if (typeof isActive === 'boolean') {
    query.andWhere('u.is_active', isActive);
  }
}

async function assertDepartment(connection, departmentId) {
  const row = await connection('departments').where({ id: departmentId }).first();
  if (!row) {
    const error = new Error('Department not found');
    error.status = 404;
    throw error;
  }

  return row;
}

async function assertUniqueEmployeeData(connection, payload, employeeId = null, userId = null) {
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

  if (payload.staff_number) {
    const row = await connection('employees').whereRaw('LOWER(staff_number) = LOWER(?)', [payload.staff_number]).first();
    if (row && row.id !== employeeId) {
      const error = new Error('Staff number already exists');
      error.status = 409;
      throw error;
    }
  }
}

async function ensureEmployeeRole(connection, userId, departmentId) {
  const role = await connection('roles').whereRaw('LOWER(name) = LOWER(?)', ['employee']).first();
  if (!role) {
    throw new Error('Employee role not configured');
  }

  const department = await connection('departments').where({ id: departmentId }).first();
  if (!department) {
    const error = new Error('Department not found');
    error.status = 404;
    throw error;
  }

  const existing = await connection('role_user').where({ user_id: userId, role_id: role.id }).orderBy('id', 'desc').first();
  if (existing) {
    await connection('role_user').where({ id: existing.id }).update({
      revoked_at: null,
      granted_at: connection.fn.now(),
      faculty_id: department.faculty_id,
      department_id: departmentId,
    });
    return;
  }

  await connection('role_user').insert({
    user_id: userId,
    role_id: role.id,
    faculty_id: department.faculty_id,
    department_id: departmentId,
    granted_at: connection.fn.now(),
    revoked_at: null,
  });
}

export async function listEmployees({ search, department_id: departmentId, employment_type: employmentType, is_active: isActive, page = 1, limit = 25 } = {}, actor) {
  const scope = buildAdminScope(actor);
  if (departmentId) {
    await assertDepartmentInScope(db, scope, departmentId);
  }

  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const rowsQuery = baseEmployeeQuery();
  applyFacultyDepartmentScope(rowsQuery, scope, { facultyColumn: 'f.id', departmentColumn: 'e.department_id' });
  applyEmployeeFilters(rowsQuery, { search, departmentId, employmentType, isActive });

  const totalQuery = db('employees as e').join('users as u', 'u.id', 'e.user_id').leftJoin('departments as d', 'd.id', 'e.department_id').leftJoin('faculties as f', 'f.id', 'd.faculty_id');
  applyFacultyDepartmentScope(totalQuery, scope, { facultyColumn: 'f.id', departmentColumn: 'e.department_id' });
  applyEmployeeFilters(totalQuery, { search, departmentId, employmentType, isActive });

  const [rows, totalRow] = await Promise.all([
    rowsQuery.orderBy('e.id', 'desc').limit(safeLimit).offset(offset),
    totalQuery.count('* as count').first(),
  ]);

  return {
    data: rows,
    meta: { page: safePage, limit: safeLimit, total: Number(totalRow?.count || 0) },
  };
}

export async function getEmployeeById(id, actor, connection = db) {
  const scope = buildAdminScope(actor);
  const query = baseEmployeeQuery(connection).where('e.id', id);
  applyFacultyDepartmentScope(query, scope, { facultyColumn: 'f.id', departmentColumn: 'e.department_id' });
  return query.first();
}

export async function createEmployee(payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertDepartmentInScope(trx, scope, payload.department_id);

    await assertUniqueEmployeeData(trx, payload);
    await assertDepartment(trx, payload.department_id);

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

    const [employee] = await trx('employees')
      .insert({
        user_id: user.id,
        staff_number: payload.staff_number,
        department_id: payload.department_id,
        job_title: payload.job_title,
        employment_type: payload.employment_type,
        salary: payload.salary ?? null,
        hired_at: payload.hired_at,
        terminated_at: payload.terminated_at || null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    await ensureEmployeeRole(trx, user.id, payload.department_id);
    return getEmployeeById(employee.id, actor, trx);
  });
}

export async function updateEmployee(id, payload, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertEmployeeInScope(trx, scope, id);

    const current = await trx('employees as e').join('users as u', 'u.id', 'e.user_id').where('e.id', id).select('e.id as employee_id', 'e.user_id', 'e.department_id').first();
    if (!current) {
      return null;
    }

    await assertUniqueEmployeeData(trx, payload, current.employee_id, current.user_id);
    const nextDepartmentId = payload.department_id ?? current.department_id;
    await assertDepartmentInScope(trx, scope, nextDepartmentId);
    await assertDepartment(trx, nextDepartmentId);

    const userPatch = {};
    const employeePatch = {};

    for (const key of ['national_id', 'first_name', 'last_name', 'email', 'phone', 'gender', 'date_of_birth', 'avatar_path', 'is_active']) {
      if (payload[key] !== undefined) {
        userPatch[key] = payload[key];
      }
    }

    if (payload.password) {
      userPatch.password = await hashPassword(payload.password);
      userPatch.must_change_password = false;
    }

    for (const key of ['staff_number', 'department_id', 'job_title', 'employment_type', 'salary', 'hired_at', 'terminated_at']) {
      if (payload[key] !== undefined) {
        employeePatch[key] = payload[key];
      }
    }

    if (Object.keys(userPatch).length > 0) {
      await trx('users').where({ id: current.user_id }).update({ ...userPatch, updated_at: trx.fn.now() });
    }

    if (Object.keys(employeePatch).length > 0) {
      await trx('employees').where({ id }).update({ ...employeePatch, updated_at: trx.fn.now() });
    }

    await ensureEmployeeRole(trx, current.user_id, nextDepartmentId);

    return getEmployeeById(id, actor, trx);
  });
}

export async function deleteEmployee(id, actor) {
  const scope = buildAdminScope(actor);
  await assertEmployeeInScope(db, scope, id);
  return db('employees').where({ id }).del();
}

export default {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
import db from '../config/knex.js';
import { assertDepartmentInScope, assertFacultyInScope, buildAdminScope } from '../utils/adminScope.js';

async function getRoleByName(connection, name) {
  const role = await connection('roles').whereRaw('LOWER(name) = LOWER(?)', [name]).first();
  if (!role) {
    throw new Error(`Role ${name} not configured`);
  }
  return role;
}

async function assertUser(connection, userId) {
  const user = await connection('users').where({ id: userId }).first();
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
}

async function assertFaculty(connection, facultyId) {
  const faculty = await connection('faculties').where({ id: facultyId }).first();
  if (!faculty) {
    const error = new Error('Faculty not found');
    error.status = 404;
    throw error;
  }
  return faculty;
}

async function assertDepartment(connection, departmentId) {
  const department = await connection('departments').where({ id: departmentId }).first();
  if (!department) {
    const error = new Error('Department not found');
    error.status = 404;
    throw error;
  }
  return department;
}

async function upsertRoleAssignment(connection, { userId, roleId, facultyId = null, departmentId = null }) {
  const existing = await connection('role_user')
    .where({ user_id: userId, role_id: roleId, faculty_id: facultyId, department_id: departmentId })
    .orderBy('id', 'desc')
    .first();

  if (existing) {
    await connection('role_user').where({ id: existing.id }).update({ revoked_at: null, granted_at: connection.fn.now() });
    return existing.id;
  }

  const [created] = await connection('role_user')
    .insert({
      user_id: userId,
      role_id: roleId,
      faculty_id: facultyId,
      department_id: departmentId,
      granted_at: connection.fn.now(),
      revoked_at: null,
    })
    .returning(['id']);

  return created.id;
}

export async function assignFacultyAdmin(facultyId, userId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    assertFacultyInScope(scope, facultyId);

    await assertFaculty(trx, facultyId);
    await assertUser(trx, userId);
    const role = await getRoleByName(trx, 'faculty_admin');

    await upsertRoleAssignment(trx, {
      userId,
      roleId: role.id,
      facultyId,
      departmentId: null,
    });

    return { assigned: true };
  });
}

export async function revokeFacultyAdmin(facultyId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    assertFacultyInScope(scope, facultyId);

    await assertFaculty(trx, facultyId);
    const role = await getRoleByName(trx, 'faculty_admin');

    const updated = await trx('role_user')
      .where({ role_id: role.id, faculty_id: facultyId })
      .whereNull('revoked_at')
      .update({ revoked_at: trx.fn.now() });

    return { revoked: updated > 0 };
  });
}

export async function assignDepartmentAdmin(departmentId, userId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertDepartmentInScope(trx, scope, departmentId);

    const department = await assertDepartment(trx, departmentId);
    await assertUser(trx, userId);
    const role = await getRoleByName(trx, 'department_admin');

    await upsertRoleAssignment(trx, {
      userId,
      roleId: role.id,
      facultyId: department.faculty_id,
      departmentId,
    });

    return { assigned: true };
  });
}

export async function revokeDepartmentAdmin(departmentId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertDepartmentInScope(trx, scope, departmentId);

    await assertDepartment(trx, departmentId);
    const role = await getRoleByName(trx, 'department_admin');

    const updated = await trx('role_user')
      .where({ role_id: role.id, department_id: departmentId })
      .whereNull('revoked_at')
      .update({ revoked_at: trx.fn.now() });

    return { revoked: updated > 0 };
  });
}

export async function assignDepartmentHead(departmentId, userId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertDepartmentInScope(trx, scope, departmentId);

    const department = await assertDepartment(trx, departmentId);
    await assertUser(trx, userId);
    const role = await getRoleByName(trx, 'department_head');

    await trx('departments').where({ id: departmentId }).update({ head_id: userId, updated_at: trx.fn.now() });
    await upsertRoleAssignment(trx, {
      userId,
      roleId: role.id,
      facultyId: department.faculty_id,
      departmentId,
    });

    return { assigned: true };
  });
}

export async function revokeDepartmentHead(departmentId, actor) {
  return db.transaction(async (trx) => {
    const scope = buildAdminScope(actor);
    await assertDepartmentInScope(trx, scope, departmentId);

    const department = await assertDepartment(trx, departmentId);
    const role = await getRoleByName(trx, 'department_head');

    await trx('departments').where({ id: departmentId }).update({ head_id: null, updated_at: trx.fn.now() });
    await trx('role_user')
      .where({ role_id: role.id, department_id: departmentId })
      .whereNull('revoked_at')
      .update({ revoked_at: trx.fn.now() });

    return { revoked: true };
  });
}

export default {
  assignFacultyAdmin,
  revokeFacultyAdmin,
  assignDepartmentAdmin,
  revokeDepartmentAdmin,
  assignDepartmentHead,
  revokeDepartmentHead,
};
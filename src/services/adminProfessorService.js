import bcrypt from 'bcryptjs';
import db from '../config/knex.js';
import { hashPassword } from '../utils/password.js';

const professorSelectColumns = [
  'p.id as professor_id',
  'p.staff_number',
  'p.specialization',
  'p.academic_rank',
  'p.office_location',
  'p.hired_at',
  'u.id as user_id',
  'u.national_id',
  'u.first_name',
  'u.last_name',
  'u.email',
  'u.phone',
  'u.gender',
  'u.date_of_birth',
  'u.avatar_path',
  'u.is_active',
  'u.created_at as user_created_at',
  'u.updated_at as user_updated_at',
  'd.id as department_id',
  'd.name as department_name',
  'd.code as department_code',
  'f.id as faculty_id',
  'f.name as faculty_name',
  'f.code as faculty_code',
];

function applyProfessorFilters(query, { search, facultyId, departmentId, academicRank, isActive } = {}) {
  if (search) {
    query.andWhere((builder) => {
      builder
        .whereILike('u.first_name', `%${search}%`)
        .orWhereILike('u.last_name', `%${search}%`)
        .orWhereILike('u.email', `%${search}%`)
        .orWhereILike('p.staff_number', `%${search}%`);
    });
  }

  if (facultyId) {
    query.andWhere('d.faculty_id', facultyId);
  }

  if (departmentId) {
    query.andWhere('p.department_id', departmentId);
  }

  if (academicRank) {
    query.andWhere('p.academic_rank', academicRank);
  }

  if (typeof isActive === 'boolean') {
    query.andWhere('u.is_active', isActive);
  }

  return query;
}

async function getProfessorRoleId(trx) {
  const role = await trx('roles').whereRaw('LOWER(name) = LOWER(?)', ['professor']).first();
  return role?.id || null;
}

async function ensureProfessorRole(trx, userId) {
  const roleId = await getProfessorRoleId(trx);
  if (!roleId) {
    throw new Error('Professor role not configured');
  }

  const existing = await trx('role_user').where({ user_id: userId, role_id: roleId }).orderBy('id', 'desc').first();
  if (existing) {
    if (existing.revoked_at) {
      await trx('role_user').where({ id: existing.id }).update({ revoked_at: null, granted_at: trx.fn.now() });
    }
    return existing.id;
  }

  const [created] = await trx('role_user')
    .insert({
      user_id: userId,
      role_id: roleId,
      granted_at: trx.fn.now(),
      revoked_at: null,
    })
    .returning(['id']);

  return created.id;
}

async function revokeProfessorRole(trx, userId) {
  const roleId = await getProfessorRoleId(trx);
  if (!roleId) {
    return;
  }

  await trx('role_user')
    .where({ user_id: userId, role_id: roleId })
    .whereNull('revoked_at')
    .update({ revoked_at: trx.fn.now() });
}

async function assertProfessorDepartment(trx, departmentId) {
  const department = await trx('departments as d')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id')
    .select('d.id', 'd.type', 'd.faculty_id', 'f.id as faculty_exists')
    .where('d.id', departmentId)
    .first();

  if (!department) {
    return null;
  }

  if (department.type !== 'academic') {
    const error = new Error('Professor department must be academic');
    error.status = 400;
    throw error;
  }

  return department;
}

export async function listProfessors({ search, faculty_id: facultyId, department_id: departmentId, academic_rank: academicRank, is_active: isActive, limit = 25, page = 1 } = {}) {
  const safeLimit = Math.min(Number(limit) || 25, 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const baseQuery = db('professors as p')
    .join('users as u', 'u.id', 'p.user_id')
    .leftJoin('departments as d', 'd.id', 'p.department_id')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id');

  applyProfessorFilters(baseQuery, { search, facultyId, departmentId, academicRank, isActive });

  const totalQuery = db('professors as p')
    .join('users as u', 'u.id', 'p.user_id')
    .leftJoin('departments as d', 'd.id', 'p.department_id')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id');
  applyProfessorFilters(totalQuery, { search, facultyId, departmentId, academicRank, isActive });

  const [rows, totalRow] = await Promise.all([
    baseQuery
      .select(professorSelectColumns)
      .orderBy('p.id', 'desc')
      .limit(safeLimit)
      .offset(offset),
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

export async function findProfessorById(id) {
  return db('professors as p')
    .join('users as u', 'u.id', 'p.user_id')
    .leftJoin('departments as d', 'd.id', 'p.department_id')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id')
    .select(professorSelectColumns)
    .where('p.id', id)
    .first();
}

async function loadProfessorSections(connection, professorId) {
  return connection('sections as s')
    .join('courses as c', 'c.id', 's.course_id')
    .leftJoin('academic_terms as t', 't.id', 's.academic_term_id')
    .select(
      's.id',
      's.capacity',
      's.room',
      's.schedule',
      's.is_active',
      's.academic_term_id',
      'c.id as course_id',
      'c.code as course_code',
      'c.name as course_name',
      'c.credit_hours',
      't.name as term_name',
      't.academic_year as term_academic_year',
      't.semester as term_semester'
    )
    .where('s.professor_id', professorId)
    .orderBy('s.id', 'desc');
}

export async function getProfessorDetailById(id, connection = db) {
  const professor = await connection('professors as p')
    .join('users as u', 'u.id', 'p.user_id')
    .leftJoin('departments as d', 'd.id', 'p.department_id')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id')
    .select(professorSelectColumns)
    .where('p.id', id)
    .first();

  if (!professor) {
    return null;
  }

  const sections = await loadProfessorSections(connection, id);
  return {
    professor,
    sections,
  };
}

async function uniqueViolation(fieldName, message) {
  const error = new Error(message);
  error.status = 409;
  error.field = fieldName;
  return error;
}

async function assertUniqueProfessorData(trx, payload, professorId = null, userId = null) {
  if (payload.national_id) {
    const existingNationalId = await trx('users').whereRaw('LOWER(national_id) = LOWER(?)', [payload.national_id]).first();
    if (existingNationalId && existingNationalId.id !== userId) {
      throw await uniqueViolation('national_id', 'National ID already exists');
    }
  }

  if (payload.email) {
    const existingEmail = await trx('users').whereRaw('LOWER(email) = LOWER(?)', [payload.email]).first();
    if (existingEmail && existingEmail.id !== userId) {
      throw await uniqueViolation('email', 'Email already exists');
    }
  }

  if (payload.staff_number) {
    const existingStaffNumber = await trx('professors').whereRaw('LOWER(staff_number) = LOWER(?)', [payload.staff_number]).first();
    if (existingStaffNumber && existingStaffNumber.id !== professorId) {
      throw await uniqueViolation('staff_number', 'Staff number already exists');
    }
  }
}

export async function createProfessor(payload) {
  return db.transaction(async (trx) => {
    await assertUniqueProfessorData(trx, payload);
    const department = await assertProfessorDepartment(trx, payload.department_id);
    if (!department) {
      const error = new Error('Department not found');
      error.status = 404;
      throw error;
    }

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

    const [professor] = await trx('professors')
      .insert({
        user_id: user.id,
        staff_number: payload.staff_number,
        department_id: department.id,
        specialization: payload.specialization,
        academic_rank: payload.academic_rank,
        office_location: payload.office_location || null,
        hired_at: payload.hired_at,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning(['id']);

    await ensureProfessorRole(trx, user.id);

    return getProfessorDetailById(professor.id, trx);
  });
}

export async function updateProfessor(id, payload) {
  return db.transaction(async (trx) => {
    const professor = await trx('professors as p').join('users as u', 'u.id', 'p.user_id').where('p.id', id).select('p.id as professor_id', 'p.user_id').first();
    if (!professor) {
      return null;
    }

    await assertUniqueProfessorData(trx, payload, professor.professor_id, professor.user_id);

    if (payload.department_id) {
      const department = await assertProfessorDepartment(trx, payload.department_id);
      if (!department) {
        const error = new Error('Department not found');
        error.status = 404;
        throw error;
      }
    }

    const userUpdates = {};
    const professorUpdates = {};

    for (const field of ['national_id', 'first_name', 'last_name', 'email', 'phone', 'gender', 'date_of_birth', 'avatar_path', 'is_active']) {
      if (payload[field] !== undefined) {
        userUpdates[field] = payload[field];
      }
    }

    for (const field of ['staff_number', 'department_id', 'specialization', 'academic_rank', 'office_location', 'hired_at']) {
      if (payload[field] !== undefined) {
        professorUpdates[field] = payload[field];
      }
    }

    if (payload.password) {
      userUpdates.password = await hashPassword(payload.password);
      userUpdates.must_change_password = false;
    }

    if (Object.keys(userUpdates).length > 0) {
      await trx('users')
        .where({ id: professor.user_id })
        .update({
          ...userUpdates,
          updated_at: trx.fn.now(),
        });
    }

    if (Object.keys(professorUpdates).length > 0) {
      await trx('professors')
        .where({ id })
        .update({
          ...professorUpdates,
          updated_at: trx.fn.now(),
        });
    }

    if (payload.is_active !== undefined) {
      await trx('users').where({ id: professor.user_id }).update({ is_active: payload.is_active, updated_at: trx.fn.now() });
    }

    if (payload.password) {
      await ensureProfessorRole(trx, professor.user_id);
    }

    return getProfessorDetailById(id, trx);
  });
}

export async function deleteProfessor(id) {
  return db.transaction(async (trx) => {
    const professor = await trx('professors').where({ id }).first();
    if (!professor) {
      return false;
    }

    await revokeProfessorRole(trx, professor.user_id);
    await trx('professors').where({ id }).del();
    return true;
  });
}

export default {
  listProfessors,
  findProfessorById,
  getProfessorDetailById,
  createProfessor,
  updateProfessor,
  deleteProfessor,
};
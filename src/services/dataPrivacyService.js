import db from '../config/knex.js';
import logger from '../utils/logger.js';

/**
 * Data Privacy Service
 * GDPR compliance: Data export, anonymization, deletion
 */

/**
 * Export all personal data for a user (GDPR Article 20 - Data Portability)
 * @param {number} userId - User ID
 * @returns {Promise<object>} Complete personal data
 */
export async function exportUserData(userId) {
  const user = await db('users').where('id', userId).first();

  if (!user) {
    throw new Error('User not found');
  }

  const data = {
    user: {
      id: user.id,
      national_id: user.national_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    roles: await db('role_user as ru')
      .join('roles as r', 'r.id', 'ru.role_id')
      .where('ru.user_id', userId)
      .whereNull('ru.revoked_at')
      .select('r.name', 'ru.scope_type', 'ru.scope_id', 'ru.created_at'),
  };

  // Add student data if exists
  const student = await db('students').where('user_id', userId).first();
  if (student) {
    data.student = await exportStudentData(student);
  }

  // Add professor data if exists
  const professor = await db('professors').where('user_id', userId).first();
  if (professor) {
    data.professor = await exportProfessorData(professor);
  }

  // Add employee data if exists
  const employee = await db('employees').where('user_id', userId).first();
  if (employee) {
    data.employee = await exportEmployeeData(employee);
  }

  // Add notifications (last 100)
  data.notifications = await db('notifications')
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .limit(100)
    .select('title', 'body', 'type', 'read_at', 'created_at');

  return data;
}

/**
 * Export student-specific data
 */
async function exportStudentData(student) {
  const enrollments = await db('enrollments as e')
    .join('sections as s', 's.id', 'e.section_id')
    .join('courses as c', 'c.id', 's.course_id')
    .leftJoin('grades as g', 'g.enrollment_id', 'e.id')
    .where('e.student_id', student.id)
    .select(
      'e.status',
      'e.registered_at',
      'e.dropped_at',
      'c.code as course_code',
      'c.name as course_name',
      'g.total as grade',
      'g.letter_grade'
    );

  return {
    student_number: student.student_number,
    academic_year: student.academic_year,
    semester: student.semester,
    enrollment_status: student.enrollment_status,
    gpa: student.gpa,
    academic_standing: student.academic_standing,
    enrolled_at: student.enrolled_at,
    graduated_at: student.graduated_at,
    faculty: await db('faculties').where('id', student.faculty_id).first(),
    department: await db('departments').where('id', student.department_id).first(),
    enrollments,
  };
}

/**
 * Export professor-specific data
 */
async function exportProfessorData(professor) {
  return {
    staff_number: professor.staff_number,
    academic_rank: professor.academic_rank,
    specialization: professor.specialization,
    office: professor.office,
    hire_date: professor.hire_date,
    department: await db('departments').where('id', professor.department_id).first(),
  };
}

/**
 * Export employee-specific data
 */
async function exportEmployeeData(employee) {
  return {
    staff_number: employee.staff_number,
    job_title: employee.job_title,
    employment_type: employee.employment_type,
    salary: employee.salary,
    hire_date: employee.hire_date,
  };
}

/**
 * Anonymize user data (GDPR Article 17 - Right to be Forgotten)
 * Soft deletes user and anonymizes personal information
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function anonymizeUser(userId) {
  return await db.transaction(async (trx) => {
    const user = await trx('users').where('id', userId).first();

    if (!user) {
      throw new Error('User not found');
    }

    // Delete avatar if exists (would need file storage integration)
    // if (user.avatar_path) { await deleteFile(user.avatar_path); }

    // Anonymize user record
    await trx('users')
      .where('id', userId)
      .update({
        national_id: `ANONYMIZED-${userId}`,
        email: `anonymized-${userId}@deleted.local`,
        first_name: 'Deleted',
        last_name: 'User',
        phone: null,
        date_of_birth: null,
        avatar_path: null,
        deleted_at: new Date(),
      });

    // Delete associated notifications
    await trx('notifications').where('user_id', userId).delete();

    logger.info(`User ${userId} anonymized successfully`);
    return true;
  });
}

/**
 * Delete all data for a user (IRREVERSIBLE)
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function hardDeleteUser(userId) {
  return await db.transaction(async (trx) => {
    const user = await trx('users').where('id', userId).first();

    if (!user) {
      throw new Error('User not found');
    }

    // Delete student data if exists
    const student = await trx('students').where('user_id', userId).first();
    if (student) {
      await trx('enrollments').where('student_id', student.id).delete();
      await trx('student_department_history').where('student_id', student.id).delete();
      await trx('students').where('id', student.id).delete();
    }

    // Delete professor data if exists
    await trx('professors').where('user_id', userId).delete();

    // Delete employee data if exists
    await trx('employees').where('user_id', userId).delete();

    // Delete notifications
    await trx('notifications').where('user_id', userId).delete();

    // Delete role assignments
    await trx('role_user').where('user_id', userId).delete();

    // Finally delete the user
    await trx('users').where('id', userId).delete();

    logger.info(`User ${userId} permanently deleted`);
    return true;
  });
}

/**
 * Get data processing summary for user
 * @param {number} userId - User ID
 * @returns {Promise<object>} Processing summary
 */
export async function getDataProcessingSummary(userId) {
  const user = await db('users').where('id', userId).first();

  if (!user) {
    throw new Error('User not found');
  }

  const student = await db('students').where('user_id', userId).first();
  const professor = await db('professors').where('user_id', userId).first();
  const employee = await db('employees').where('user_id', userId).first();

  return {
    user_id: userId,
    data_categories: {
      personal_information: !!user,
      student_records: !!student,
      professor_records: !!professor,
      employee_records: !!employee,
      notifications: await db('notifications').where('user_id', userId).count('* as count').first().then(r => parseInt(r.count)),
      role_assignments: await db('role_user').where('user_id', userId).count('* as count').first().then(r => parseInt(r.count)),
    },
    last_updated: user.updated_at,
    retention_period: 'Until account deletion or 7 years after graduation',
    legal_basis: 'Contract performance and legitimate interest',
  };
}

export default {
  exportUserData,
  anonymizeUser,
  hardDeleteUser,
  getDataProcessingSummary,
};

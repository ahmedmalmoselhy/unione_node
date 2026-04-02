import bcrypt from 'bcryptjs';
import db from '../config/knex.js';

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return headers.reduce((row, header, index) => {
      row[header] = (values[index] ?? '').trim();
      return row;
    }, {});
  });
}

function normalizeEmpty(value) {
  return value === '' ? null : value;
}

async function resolveFacultyDepartment(facultyCode, departmentCode, trx) {
  const faculty = await trx('faculties').whereRaw('LOWER(code) = LOWER(?)', [facultyCode]).first();
  const department = await trx('departments').whereRaw('LOWER(code) = LOWER(?)', [departmentCode]).first();

  if (!faculty || !department) {
    return null;
  }

  return { faculty, department };
}

export async function importStudentsFromCsv(csvText) {
  const rows = parseCsv(csvText);
  const result = { imported: 0, errors: [] };

  await db.transaction(async (trx) => {
    for (const [index, row] of rows.entries()) {
      const facultyDepartment = await resolveFacultyDepartment(row.faculty_code, row.department_code, trx);

      if (!facultyDepartment) {
        result.errors.push({ row: index + 2, message: 'Invalid faculty_code or department_code' });
        continue;
      }

      const existingUser = await trx('users').whereRaw('LOWER(email) = LOWER(?)', [row.email]).first();
      const passwordHash = await bcrypt.hash(`import-${row.student_number}`, 10);

      let userId = existingUser?.id;
      if (!userId) {
        const [createdUser] = await trx('users')
          .insert({
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            password: passwordHash,
            is_active: true,
            must_change_password: true,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          })
          .returning(['id']);
        userId = createdUser.id;
      } else {
        await trx('users').where({ id: userId }).update({
          first_name: row.first_name,
          last_name: row.last_name,
          updated_at: trx.fn.now(),
        });
      }

      const studentPayload = {
        user_id: userId,
        student_number: row.student_number,
        faculty_id: facultyDepartment.faculty.id,
        department_id: facultyDepartment.department.id,
        academic_year: Number(row.academic_year || 1),
        semester: Number(row.semester || 1),
        enrollment_status: row.enrollment_status || 'active',
        gpa: row.gpa ? Number(row.gpa) : null,
        academic_standing: row.academic_standing || 'good',
        enrolled_at: normalizeEmpty(row.enrolled_at),
        graduated_at: normalizeEmpty(row.graduated_at),
        updated_at: trx.fn.now(),
      };

      const existingStudent = await trx('students').whereRaw('LOWER(student_number) = LOWER(?)', [row.student_number]).first();
      if (existingStudent) {
        await trx('students').where({ id: existingStudent.id }).update(studentPayload);
      } else {
        await trx('students').insert({ ...studentPayload, created_at: trx.fn.now() });
      }

      result.imported += 1;
    }
  });

  return result;
}

export async function importProfessorsFromCsv(csvText) {
  const rows = parseCsv(csvText);
  const result = { imported: 0, errors: [] };

  await db.transaction(async (trx) => {
    for (const [index, row] of rows.entries()) {
      const department = await trx('departments').whereRaw('LOWER(code) = LOWER(?)', [row.department_code]).first();
      if (!department) {
        result.errors.push({ row: index + 2, message: 'Invalid department_code' });
        continue;
      }

      const existingUser = await trx('users').whereRaw('LOWER(email) = LOWER(?)', [row.email]).first();
      const passwordHash = await bcrypt.hash(`import-${row.staff_number}`, 10);

      let userId = existingUser?.id;
      if (!userId) {
        const [createdUser] = await trx('users')
          .insert({
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            password: passwordHash,
            is_active: true,
            must_change_password: true,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          })
          .returning(['id']);
        userId = createdUser.id;
      } else {
        await trx('users').where({ id: userId }).update({
          first_name: row.first_name,
          last_name: row.last_name,
          updated_at: trx.fn.now(),
        });
      }

      const professorPayload = {
        user_id: userId,
        staff_number: row.staff_number,
        department_id: department.id,
        specialization: normalizeEmpty(row.specialization),
        academic_rank: row.academic_rank || 'Assistant Professor',
        office_location: normalizeEmpty(row.office_location),
        hired_at: normalizeEmpty(row.hired_at) || trx.fn.now(),
        updated_at: trx.fn.now(),
      };

      const existingProfessor = await trx('professors').whereRaw('LOWER(staff_number) = LOWER(?)', [row.staff_number]).first();
      if (existingProfessor) {
        await trx('professors').where({ id: existingProfessor.id }).update(professorPayload);
      } else {
        await trx('professors').insert({ ...professorPayload, created_at: trx.fn.now() });
      }

      result.imported += 1;
    }
  });

  return result;
}

export async function importGradesFromCsv(csvText) {
  const rows = parseCsv(csvText);
  const result = { imported: 0, errors: [] };

  await db.transaction(async (trx) => {
    for (const [index, row] of rows.entries()) {
      const enrollmentId = Number(row.enrollment_id);
      if (!enrollmentId) {
        result.errors.push({ row: index + 2, message: 'Missing enrollment_id' });
        continue;
      }

      const enrollment = await trx('enrollments').where({ id: enrollmentId }).first();
      if (!enrollment) {
        result.errors.push({ row: index + 2, message: 'Enrollment not found' });
        continue;
      }

      const gradePayload = {
        enrollment_id: enrollmentId,
        midterm: row.midterm ? Number(row.midterm) : null,
        final: row.final ? Number(row.final) : null,
        coursework: row.coursework ? Number(row.coursework) : null,
        total: row.total ? Number(row.total) : null,
        letter_grade: normalizeEmpty(row.letter_grade),
        grade_points: row.grade_points ? Number(row.grade_points) : null,
        graded_at: normalizeEmpty(row.graded_at) || trx.fn.now(),
        updated_at: trx.fn.now(),
      };

      const existingGrade = await trx('grades').where({ enrollment_id: enrollmentId }).first();
      if (existingGrade) {
        await trx('grades').where({ id: existingGrade.id }).update(gradePayload);
      } else {
        await trx('grades').insert({ ...gradePayload, created_at: trx.fn.now() });
      }

      result.imported += 1;
    }
  });

  return result;
}

export function parseImportCsv(csvText) {
  return parseCsv(csvText);
}

export default {
  importStudentsFromCsv,
  importProfessorsFromCsv,
  importGradesFromCsv,
  parseImportCsv,
};
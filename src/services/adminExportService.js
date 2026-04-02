import db from '../config/knex.js';

function escapeCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsv(rows) {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(','));
  }

  return `${lines.join('\n')}\n`;
}

function scopeStudents(query, facultyId, departmentId) {
  return query
    .when(facultyId, (builder) => builder.where('s.faculty_id', facultyId))
    .when(departmentId, (builder) => builder.where('s.department_id', departmentId));
}

function scopeDepartments(query, facultyId, departmentId) {
  return query
    .when(facultyId, (builder) => builder.where('d.faculty_id', facultyId))
    .when(departmentId, (builder) => builder.where('d.id', departmentId));
}

function scopeSections(query, facultyId, departmentId, academicTermId) {
  return query
    .when(academicTermId, (builder) => builder.where('e.academic_term_id', academicTermId));
}

function scopeEnrollmentCourse(query, facultyId, departmentId) {
  return query
    .when(facultyId, (builder) => builder.whereExists(function whereEnrollmentFaculty() {
      this.select(db.raw('1'))
        .from('department_course as dc')
        .join('departments as d', 'd.id', 'dc.department_id')
        .whereRaw('dc.course_id = c.id')
        .andWhere('d.faculty_id', facultyId);
    }))
    .when(departmentId, (builder) => builder.whereExists(function whereEnrollmentDepartment() {
      this.select(db.raw('1'))
        .from('department_course as dc')
        .whereRaw('dc.course_id = c.id')
        .andWhere('dc.department_id', departmentId);
    }));
}

export async function exportStudents({ faculty_id: facultyId, department_id: departmentId } = {}) {
  const rows = await scopeStudents(db('students as s')
    .join('users as u', 'u.id', 's.user_id')
    .leftJoin('faculties as f', 'f.id', 's.faculty_id')
    .leftJoin('departments as d', 'd.id', 's.department_id'), facultyId, departmentId)
    .select(
      's.student_number',
      'u.first_name',
      'u.last_name',
      'u.email',
      's.academic_year',
      's.semester',
      's.enrollment_status',
      's.gpa',
      's.academic_standing',
      'f.name as faculty_name',
      'd.name as department_name',
      's.enrolled_at',
      's.graduated_at'
    )
    .orderBy('s.student_number', 'asc');

  return buildCsv(rows.map((row) => ({
    student_number: row.student_number,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    faculty_name: row.faculty_name,
    department_name: row.department_name,
    academic_year: row.academic_year,
    semester: row.semester,
    enrollment_status: row.enrollment_status,
    gpa: row.gpa,
    academic_standing: row.academic_standing,
    enrolled_at: row.enrolled_at,
    graduated_at: row.graduated_at,
  })));
}

export async function exportProfessors({ faculty_id: facultyId, department_id: departmentId } = {}) {
  const rows = await db('professors as p')
    .join('users as u', 'u.id', 'p.user_id')
    .leftJoin('departments as d', 'd.id', 'p.department_id')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id')
    .modify((query) => scopeDepartments(query, facultyId, departmentId))
    .select(
      'p.staff_number',
      'u.first_name',
      'u.last_name',
      'u.email',
      'p.specialization',
      'p.academic_rank',
      'p.office_location',
      'p.hired_at',
      'f.name as faculty_name',
      'd.name as department_name'
    )
    .orderBy('p.staff_number', 'asc');

  return buildCsv(rows);
}

export async function exportEmployees({ faculty_id: facultyId, department_id: departmentId } = {}) {
  const rows = await db('employees as e')
    .join('users as u', 'u.id', 'e.user_id')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('faculties as f', 'f.id', 'd.faculty_id')
    .modify((query) => scopeDepartments(query, facultyId, departmentId))
    .select(
      'e.staff_number',
      'u.first_name',
      'u.last_name',
      'u.email',
      'e.position',
      'e.hired_at',
      'f.name as faculty_name',
      'd.name as department_name'
    )
    .orderBy('e.staff_number', 'asc');

  return buildCsv(rows);
}

export async function exportEnrollments({ faculty_id: facultyId, department_id: departmentId, academic_term_id: academicTermId, status } = {}) {
  const rows = await scopeEnrollmentCourse(db('enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as u', 'u.id', 's.user_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id')
    .leftJoin('departments as d', 'd.id', 's.department_id'), facultyId, departmentId)
    .modify((query) => scopeSections(query, facultyId, departmentId, academicTermId))
    .when(status, (query) => query.where('e.status', status))
    .select(
      'e.id as enrollment_id',
      's.student_number',
      'u.first_name',
      'u.last_name',
      'c.code as course_code',
      'c.name as course_name',
      'sec.id as section_id',
      'e.status',
      'e.registered_at',
      'e.dropped_at',
      't.name as term_name',
      'd.name as department_name'
    )
    .orderBy('e.id', 'asc');

  return buildCsv(rows);
}

export async function exportGrades({ faculty_id: facultyId, department_id: departmentId, academic_term_id: academicTermId } = {}) {
  const rows = await db('grades as g')
    .join('enrollments as e', 'e.id', 'g.enrollment_id')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as u', 'u.id', 's.user_id')
    .join('sections as sec', 'sec.id', 'e.section_id')
    .join('courses as c', 'c.id', 'sec.course_id')
    .leftJoin('academic_terms as t', 't.id', 'e.academic_term_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .modify((query) => scopeStudents(query, facultyId, departmentId))
    .when(academicTermId, (query) => query.where('e.academic_term_id', academicTermId))
    .select(
      'g.id as grade_id',
      's.student_number',
      'u.first_name',
      'u.last_name',
      'c.code as course_code',
      'c.name as course_name',
      'e.status as enrollment_status',
      'g.midterm',
      'g.final',
      'g.coursework',
      'g.total',
      'g.letter_grade',
      'g.grade_points',
      'g.graded_at',
      't.name as term_name',
      'd.name as department_name'
    )
    .orderBy('g.id', 'asc');

  return buildCsv(rows);
}

export function buildCsvDownload(filenameBase, csv) {
  return {
    filename: `${filenameBase}.csv`,
    content: csv,
  };
}
const templates = {
  students: [
    'student_number,first_name,last_name,email,faculty_code,department_code,academic_year,semester,enrollment_status,gpa,academic_standing,enrolled_at,graduated_at',
    'S1001,Alice,Smith,alice@example.com,FAC-ENG,CS,1,1,active,3.5,good,2026-01-10,',
  ].join('\n'),
  professors: [
    'staff_number,first_name,last_name,email,department_code,specialization,academic_rank,office_location,hired_at',
    'P1001,John,Doe,john@example.com,CS,Software Engineering,Assistant Professor,Room 201,2026-01-10',
  ].join('\n'),
  grades: [
    'enrollment_id,midterm,final,coursework,total,letter_grade,grade_points,graded_at',
    '1,20,40,20,80,A,4.0,2026-03-01',
  ].join('\n'),
};

export function getImportTemplate(type) {
  return templates[type] || null;
}

export default {
  getImportTemplate,
};
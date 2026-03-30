import { nowTs } from './_seed_utils.js';

const slots = [
  [{ day: 'sunday', start_time: '08:00', end_time: '09:30', type: 'lecture' }, { day: 'tuesday', start_time: '08:00', end_time: '09:30', type: 'lecture' }],
  [{ day: 'monday', start_time: '10:00', end_time: '11:30', type: 'lecture' }, { day: 'wednesday', start_time: '10:00', end_time: '11:30', type: 'lecture' }],
  [{ day: 'sunday', start_time: '12:00', end_time: '13:30', type: 'lecture' }, { day: 'wednesday', start_time: '12:00', end_time: '13:30', type: 'lecture' }],
  [{ day: 'monday', start_time: '08:00', end_time: '09:30', type: 'lecture' }, { day: 'thursday', start_time: '08:00', end_time: '09:30', type: 'lecture' }],
  [{ day: 'tuesday', start_time: '10:00', end_time: '11:30', type: 'lecture' }, { day: 'thursday', start_time: '10:00', end_time: '11:30', type: 'lecture' }],
  [{ day: 'sunday', start_time: '14:00', end_time: '15:30', type: 'lecture' }, { day: 'tuesday', start_time: '14:00', end_time: '15:30', type: 'lecture' }],
  [{ day: 'monday', start_time: '12:00', end_time: '13:30', type: 'lecture' }, { day: 'wednesday', start_time: '08:00', end_time: '09:30', type: 'lecture' }],
  [{ day: 'tuesday', start_time: '12:00', end_time: '13:30', type: 'lecture' }, { day: 'thursday', start_time: '12:00', end_time: '13:30', type: 'lecture' }],
];

const rooms = ['A101','A102','A103','B201','B202','B203','C301','C302','D101','D102','D201','D202','E101','E102','F201','F202'];

export async function seed(knex) {
  const hasSections = await knex('sections').first('id');
  if (hasSections) return;

  const now = nowTs();
  const terms = await knex('academic_terms').orderBy('starts_at').select('id', 'is_active');

  const ownerLinks = await knex('department_course')
    .join('courses', 'courses.id', '=', 'department_course.course_id')
    .join('departments', 'departments.id', '=', 'department_course.department_id')
    .where('department_course.is_owner', true)
    .select('courses.id as course_id', 'department_course.department_id as owner_dept_id', 'departments.faculty_id');

  const profs = await knex('professors').select('id', 'department_id');
  const profsByDept = {};
  for (const p of profs) {
    if (!profsByDept[p.department_id]) profsByDept[p.department_id] = [];
    profsByDept[p.department_id].push(p.id);
  }

  const profsByFaculty = {};
  const profFacultyRows = await knex('professors')
    .join('departments', 'departments.id', '=', 'professors.department_id')
    .whereNotNull('departments.faculty_id')
    .select('professors.id as professor_id', 'departments.faculty_id');

  for (const row of profFacultyRows) {
    if (!profsByFaculty[row.faculty_id]) profsByFaculty[row.faculty_id] = [];
    profsByFaculty[row.faculty_id].push(row.professor_id);
  }

  let slotIdx = 0;
  let roomIdx = 0;

  for (const link of ownerLinks) {
    const pool =
      profsByDept[link.owner_dept_id] ||
      (link.faculty_id ? profsByFaculty[link.faculty_id] || [] : []);
    if (!pool.length) continue;

    for (const term of terms) {
      for (let s = 0; s < 2; s += 1) {
        await knex('sections').insert({
          course_id: link.course_id,
          professor_id: pool[(slotIdx + s) % pool.length],
          academic_term_id: term.id,
          capacity: 60,
          room: rooms[roomIdx % rooms.length],
          schedule: JSON.stringify(slots[(slotIdx + s) % slots.length]),
          is_active: !!term.is_active,
          created_at: now,
          updated_at: now,
        });
        roomIdx += 1;
      }
      slotIdx += 1;
    }
  }
}

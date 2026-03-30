import { nowTs } from './_seed_utils.js';

const gradeScale = [
  { min: 90, letter: 'A+', points: 4.0 },
  { min: 85, letter: 'A', points: 3.75 },
  { min: 80, letter: 'B+', points: 3.5 },
  { min: 75, letter: 'B', points: 3.0 },
  { min: 70, letter: 'C+', points: 2.5 },
  { min: 65, letter: 'C', points: 2.0 },
  { min: 60, letter: 'D+', points: 1.5 },
  { min: 50, letter: 'D', points: 1.0 },
  { min: 0, letter: 'F', points: 0.0 },
];

export async function seed(knex) {
  const hasGrades = await knex('grades').first('id');
  if (hasGrades) return;

  const now = nowTs();
  const grader = await knex('users')
    .join('role_user', 'users.id', '=', 'role_user.user_id')
    .join('roles', 'roles.id', '=', 'role_user.role_id')
    .where('roles.name', 'admin')
    .select('users.id')
    .first();

  const enrollments = await knex('enrollments')
    .whereIn('status', ['completed', 'failed'])
    .orderBy('id')
    .select('id', 'status', 'registered_at');

  const rows = [];
  for (const e of enrollments) {
    let midterm;
    let coursework;
    let finalScore;

    if (e.status === 'failed') {
      midterm = 5 + Math.floor(Math.random() * 16);
      coursework = 5 + Math.floor(Math.random() * 11);
      finalScore = 5 + Math.floor(Math.random() * 11);
    } else {
      midterm = 15 + Math.floor(Math.random() * 26);
      coursework = 10 + Math.floor(Math.random() * 21);
      finalScore = 20 + Math.floor(Math.random() * 21);
    }

    const total = Math.min(midterm + coursework + finalScore, 100);
    const grade = gradeScale.find((g) => total >= g.min) || gradeScale[gradeScale.length - 1];
    const gradedAt = e.registered_at ? new Date(new Date(e.registered_at).getTime() + 120 * 24 * 3600 * 1000) : now;

    rows.push({
      enrollment_id: e.id,
      midterm,
      final: finalScore,
      coursework,
      total,
      letter_grade: grade.letter,
      grade_points: grade.points,
      graded_by: grader?.id ?? null,
      graded_at: gradedAt,
      created_at: now,
      updated_at: now,
    });
  }

  for (let i = 0; i < rows.length; i += 500) {
    await knex('grades').insert(rows.slice(i, i + 500));
  }
}

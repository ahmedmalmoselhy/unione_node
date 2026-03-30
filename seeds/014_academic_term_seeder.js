import { nowTs } from './_seed_utils.js';

const terms = [
  { name: 'Second Semester 2022/2023', name_ar: 'الفصل الثاني 2022/2023', academic_year: 2022, semester: 'second', starts_at: '2023-02-01', ends_at: '2023-06-01', registration_starts_at: '2023-01-15', registration_ends_at: '2023-01-28', withdrawal_deadline: '2023-03-15', exam_starts_at: '2023-05-15', exam_ends_at: '2023-06-01', grade_submission_deadline: '2023-06-15', is_active: false },
  { name: 'First Semester 2023/2024', name_ar: 'الفصل الأول 2023/2024', academic_year: 2023, semester: 'first', starts_at: '2023-09-15', ends_at: '2024-01-15', registration_starts_at: '2023-08-20', registration_ends_at: '2023-09-10', withdrawal_deadline: '2023-11-01', exam_starts_at: '2024-01-02', exam_ends_at: '2024-01-15', grade_submission_deadline: '2024-01-30', is_active: false },
  { name: 'Second Semester 2023/2024', name_ar: 'الفصل الثاني 2023/2024', academic_year: 2023, semester: 'second', starts_at: '2024-02-01', ends_at: '2024-06-01', registration_starts_at: '2024-01-15', registration_ends_at: '2024-01-28', withdrawal_deadline: '2024-03-15', exam_starts_at: '2024-05-18', exam_ends_at: '2024-06-01', grade_submission_deadline: '2024-06-15', is_active: false },
  { name: 'First Semester 2024/2025', name_ar: 'الفصل الأول 2024/2025', academic_year: 2024, semester: 'first', starts_at: '2024-09-15', ends_at: '2025-01-15', registration_starts_at: '2024-08-20', registration_ends_at: '2024-09-10', withdrawal_deadline: '2024-11-01', exam_starts_at: '2025-01-02', exam_ends_at: '2025-01-15', grade_submission_deadline: '2025-01-30', is_active: false },
  { name: 'Second Semester 2024/2025', name_ar: 'الفصل الثاني 2024/2025', academic_year: 2024, semester: 'second', starts_at: '2025-02-01', ends_at: '2025-06-01', registration_starts_at: '2025-01-15', registration_ends_at: '2025-01-28', withdrawal_deadline: '2025-03-15', exam_starts_at: '2025-05-18', exam_ends_at: '2025-06-01', grade_submission_deadline: '2025-06-15', is_active: false },
  { name: 'Summer Semester 2024/2025', name_ar: 'الفصل الصيفي 2024/2025', academic_year: 2024, semester: 'summer', starts_at: '2025-06-20', ends_at: '2025-08-15', registration_starts_at: '2025-06-05', registration_ends_at: '2025-06-18', withdrawal_deadline: '2025-07-05', exam_starts_at: '2025-08-05', exam_ends_at: '2025-08-15', grade_submission_deadline: '2025-08-25', is_active: false },
  { name: 'First Semester 2025/2026', name_ar: 'الفصل الأول 2025/2026', academic_year: 2025, semester: 'first', starts_at: '2025-09-14', ends_at: '2026-01-15', registration_starts_at: '2025-08-20', registration_ends_at: '2025-09-10', withdrawal_deadline: '2025-11-01', exam_starts_at: '2026-01-02', exam_ends_at: '2026-01-15', grade_submission_deadline: '2026-01-30', is_active: true },
];

export async function seed(knex) {
  const now = nowTs();
  for (const t of terms) {
    const existing = await knex('academic_terms').where({ academic_year: t.academic_year, semester: t.semester }).first('id');
    const payload = { ...t, updated_at: now };
    if (existing) {
      await knex('academic_terms').where({ id: existing.id }).update(payload);
    } else {
      await knex('academic_terms').insert({ ...payload, created_at: now });
    }
  }
}

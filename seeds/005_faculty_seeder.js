import { nowTs } from './_seed_utils.js';

const faculties = [
  { name: 'Faculty of Computer Science & Information Technology', name_ar: 'كلية علوم الحاسب وتكنولوجيا المعلومات', code: 'CSIT', enrollment_type: 'immediate' },
  { name: 'Faculty of Engineering', name_ar: 'كلية الهندسة', code: 'ENG', enrollment_type: 'deferred' },
  { name: 'Faculty of Medicine', name_ar: 'كلية الطب', code: 'MED', enrollment_type: 'none' },
  { name: 'Faculty of Business Administration', name_ar: 'كلية إدارة الأعمال', code: 'BUS', enrollment_type: 'deferred' },
  { name: 'Faculty of Law', name_ar: 'كلية الحقوق', code: 'LAW', enrollment_type: 'none' },
];

export async function seed(knex) {
  const now = nowTs();

  for (const faculty of faculties) {
    const existing = await knex('faculties').where({ code: faculty.code }).first('id');
    const payload = { ...faculty, is_active: true, updated_at: now };

    if (existing) {
      await knex('faculties').where({ id: existing.id }).update(payload);
    } else {
      await knex('faculties').insert({ ...payload, created_at: now });
    }
  }
}

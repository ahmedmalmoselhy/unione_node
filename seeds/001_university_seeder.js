import { nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const now = nowTs();
  const existing = await knex('university').where({ id: 1 }).first('id');

  const payload = {
    id: 1,
    name: 'Unione University',
    name_ar: 'جامعة يونيون',
    address: '14 Al-Nahda Street, Cairo, Egypt',
    logo_path: null,
    established_at: '1993-09-01',
    created_at: now,
    updated_at: now,
  };

  if (existing) {
    await knex('university').where({ id: 1 }).update(payload);
  } else {
    await knex('university').insert(payload);
  }
}

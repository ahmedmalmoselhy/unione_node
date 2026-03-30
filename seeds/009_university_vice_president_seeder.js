import { nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const now = nowTs();
  const uni = await knex('university').first('id');
  if (!uni) return;

  const vpSpecs = [
    { staff_number: 'PROF-0001', title: 'Vice President for Academic Affairs', title_ar: 'نائب الرئيس للشؤون الأكاديمية', order: 1, is_active: true, appointed_at: '2020-09-01', ended_at: null },
    { staff_number: 'PROF-0003', title: 'Vice President for Research & Innovation', title_ar: 'نائب الرئيس للبحث العلمي والابتكار', order: 2, is_active: true, appointed_at: '2021-01-15', ended_at: null },
    { staff_number: 'PROF-0005', title: 'Vice President for Student Affairs', title_ar: 'نائب الرئيس لشؤون الطلاب', order: 3, is_active: true, appointed_at: '2019-09-01', ended_at: null },
    { staff_number: 'PROF-0007', title: 'Vice President for Community Service', title_ar: 'نائب الرئيس لخدمة المجتمع', order: 4, is_active: false, appointed_at: '2018-09-01', ended_at: '2023-08-31' },
  ];

  for (const vp of vpSpecs) {
    const prof = await knex('professors').where({ staff_number: vp.staff_number }).first('id');
    if (!prof) continue;

    await knex('university_vice_presidents')
      .insert({
        university_id: uni.id,
        professor_id: prof.id,
        title: vp.title,
        title_ar: vp.title_ar,
        order: vp.order,
        is_active: vp.is_active,
        appointed_at: vp.appointed_at,
        ended_at: vp.ended_at,
        created_at: now,
        updated_at: now,
      })
      .onConflict('professor_id')
      .ignore();
  }
}

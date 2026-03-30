import { nowTs } from './_seed_utils.js';

async function buildSectionMap(knex, termId) {
  const sections = await knex('sections')
    .join('courses', 'courses.id', '=', 'sections.course_id')
    .where('sections.academic_term_id', termId)
    .select('sections.id as section_id', 'sections.course_id', 'courses.level');

  const deptLinks = await knex('department_course').select('department_id', 'course_id').orderBy('department_id');
  const byCourse = {};
  for (const d of deptLinks) {
    if (!byCourse[d.course_id]) byCourse[d.course_id] = [];
    byCourse[d.course_id].push(d.department_id);
  }

  const map = {};
  for (const sec of sections) {
    const deptIds = byCourse[sec.course_id] || [];
    for (const depId of deptIds) {
      map[depId] ||= {};
      map[depId][sec.level] ||= {};
      if (!map[depId][sec.level][sec.course_id]) map[depId][sec.level][sec.course_id] = sec.section_id;
    }
  }

  const flat = {};
  for (const [depId, levels] of Object.entries(map)) {
    flat[depId] = {};
    for (const [lvl, courses] of Object.entries(levels)) flat[depId][lvl] = Object.values(courses);
  }
  return flat;
}

export async function seed(knex) {
  const hasEnroll = await knex('enrollments').first('id');
  if (hasEnroll) return;

  const now = nowTs();
  const activeTerm = await knex('academic_terms').where({ is_active: true }).first();
  if (!activeTerm) return;

  const pastTerms = await knex('academic_terms').where({ is_active: false }).orderBy('starts_at');
  const students = await knex('students').where({ enrollment_status: 'active' }).whereNotNull('department_id');
  if (!students.length) return;

  const activeMap = await buildSectionMap(knex, activeTerm.id);
  const rows = [];
  const seen = new Set();

  for (const st of students) {
    const sectionIds = activeMap[st.department_id]?.[st.academic_year] || [];
    for (const sid of sectionIds) {
      const key = `${st.id}-${sid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        student_id: st.id,
        section_id: sid,
        academic_term_id: activeTerm.id,
        status: 'registered',
        registered_at: activeTerm.starts_at,
        dropped_at: null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  const lastThreePast = [...pastTerms].reverse().slice(0, 3);
  for (let idx = 0; idx < lastThreePast.length; idx += 1) {
    const term = lastThreePast[idx];
    const map = await buildSectionMap(knex, term.id);
    const statusPool = ['completed','completed','completed','completed','failed','dropped'];

    for (const st of students) {
      const pastYear = st.academic_year - (idx + 1);
      if (pastYear < 1) continue;
      const sectionIds = map[st.department_id]?.[pastYear] || [];

      for (const sid of sectionIds) {
        const key = `${st.id}-${sid}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const status = statusPool[Math.floor(Math.random() * statusPool.length)];
        rows.push({
          student_id: st.id,
          section_id: sid,
          academic_term_id: term.id,
          status,
          registered_at: term.starts_at,
          dropped_at: status === 'dropped' ? new Date(new Date(term.starts_at).getTime() + 20 * 24 * 3600 * 1000) : null,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  for (let i = 0; i < rows.length; i += 500) {
    await knex('enrollments').insert(rows.slice(i, i + 500));
  }
}

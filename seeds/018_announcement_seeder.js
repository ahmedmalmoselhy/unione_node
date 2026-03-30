import { nowTs } from './_seed_utils.js';

export async function seed(knex) {
  const hasAnnouncements = await knex('announcements').first('id');
  if (hasAnnouncements) return;

  const now = nowTs();
  const admin = await knex('users')
    .join('role_user', 'users.id', '=', 'role_user.user_id')
    .join('roles', 'roles.id', '=', 'role_user.role_id')
    .where('roles.name', 'admin')
    .select('users.id')
    .first();

  if (!admin) return;

  const faculties = await knex('faculties').where({ is_active: true }).select('id');
  const departments = await knex('departments').where({ is_active: true }).select('id');
  const sections = await knex('sections').where({ is_active: true }).select('id');

  const d = (days) => new Date(now.getTime() + days * 24 * 3600 * 1000);

  const announcements = [
    { title: 'Welcome to the New Academic Year 2025', body: "We are pleased to welcome all students, faculty, and staff to the new academic year. Let's make this a productive and rewarding year for everyone.", type: 'general', visibility: 'university', target_id: null, published_at: d(-30), expires_at: null },
    { title: 'Campus Maintenance: Water Supply Interruption', body: 'Please be advised that the campus water supply will be interrupted on Saturday from 8AM–4PM for scheduled maintenance. Plan accordingly.', type: 'administrative', visibility: 'university', target_id: null, published_at: d(-5), expires_at: d(2) },
    { title: 'URGENT: Campus Closure Due to Weather Alert', body: 'Due to severe weather forecasts, the campus will be closed tomorrow. All classes are cancelled. Stay safe and monitor official channels for updates.', type: 'urgent', visibility: 'university', target_id: null, published_at: d(-2), expires_at: d(-1) },
    { title: 'Registration for Spring 2026 Opens Soon', body: 'Registration for the Spring 2026 semester will open on December 15. Please review the course catalog and meet with your academic advisor before registering.', type: 'academic', visibility: 'university', target_id: null, published_at: null, expires_at: null },
  ];

  faculties.slice(0, 3).forEach((f, i) => {
    announcements.push({
      title: 'Faculty Meeting — End of Semester Review',
      body: 'All faculty staff are required to attend the end-of-semester review meeting. Please check your faculty email for specific date and time.',
      type: 'administrative',
      visibility: 'faculty',
      target_id: f.id,
      published_at: d(-(10 + i)),
      expires_at: d(20),
    });
  });

  departments.slice(0, 4).forEach((dep, i) => {
    announcements.push({
      title: 'Department Seminar: Research Showcase',
      body: 'Our department is hosting a research showcase next week. Students and faculty are encouraged to attend. Refreshments will be provided.',
      type: 'academic',
      visibility: 'department',
      target_id: dep.id,
      published_at: d(-(7 + i)),
      expires_at: d(7),
    });
  });

  sections.slice(0, 3).forEach((sec, i) => {
    announcements.push({
      title: 'Midterm Exam Schedule Update',
      body: 'The midterm exam for this section has been rescheduled. Please check the updated schedule on the course portal.',
      type: 'academic',
      visibility: 'section',
      target_id: sec.id,
      published_at: d(-(3 + i)),
      expires_at: d(14),
    });
  });

  const rows = announcements.map((a) => ({ ...a, author_id: admin.id, created_at: now, updated_at: now }));
  await knex('announcements').insert(rows);
}

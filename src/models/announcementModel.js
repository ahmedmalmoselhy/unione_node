import db from '../config/knex.js';

function roleScopeIds(user, key) {
  if (!Array.isArray(user?.roles)) {
    return [];
  }

  return user.roles
    .map((role) => role[key])
    .filter((id) => id !== null && id !== undefined)
    .map((id) => Number(id));
}

export async function listVisibleAnnouncements(user) {
  const facultyIds = roleScopeIds(user, 'faculty_id');
  const departmentIds = roleScopeIds(user, 'department_id');

  return db('announcements as a')
    .leftJoin('users as u', 'u.id', 'a.author_id')
    .whereNull('a.deleted_at')
    .andWhere((query) => {
      query
        .where('a.visibility', 'university')
        .orWhere((q) => {
          if (facultyIds.length) {
            q.where('a.visibility', 'faculty').whereIn('a.target_id', facultyIds);
          }
        })
        .orWhere((q) => {
          if (departmentIds.length) {
            q.where('a.visibility', 'department').whereIn('a.target_id', departmentIds);
          }
        })
        .orWhere('a.author_id', user.id);
    })
    .select(
      'a.id',
      'a.title',
      'a.body',
      'a.type',
      'a.visibility',
      'a.target_id',
      'a.published_at',
      'a.expires_at',
      'a.created_at',
      'a.updated_at',
      'u.first_name as author_first_name',
      'u.last_name as author_last_name'
    )
    .orderBy('a.created_at', 'desc');
}

export async function markAnnouncementRead(announcementId, userId) {
  await db('announcement_reads')
    .insert({
      announcement_id: announcementId,
      user_id: userId,
      read_at: db.fn.now(),
    })
    .onConflict(['announcement_id', 'user_id'])
    .merge({ read_at: db.fn.now() });
}

export async function createAnnouncement(payload) {
  const [created] = await db('announcements')
    .insert({
      ...payload,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return created;
}

export async function updateAnnouncementById(id, payload) {
  const [updated] = await db('announcements')
    .where({ id })
    .whereNull('deleted_at')
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return updated;
}

export async function softDeleteAnnouncementById(id) {
  const [updated] = await db('announcements')
    .where({ id })
    .whereNull('deleted_at')
    .update({
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return updated;
}

export async function listSectionAnnouncementsForStudent(userId, sectionId) {
  return db('section_announcements as sa')
    .join('sections as sec', 'sec.id', 'sa.section_id')
    .join('enrollments as e', 'e.section_id', 'sec.id')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as au', 'au.id', 'sa.author_id')
    .where('s.user_id', userId)
    .andWhere('sec.id', sectionId)
    .select(
      'sa.id',
      'sa.section_id',
      'sa.author_id',
      'sa.title',
      'sa.body',
      'sa.published_at',
      'sa.created_at',
      'sa.updated_at',
      'au.first_name as author_first_name',
      'au.last_name as author_last_name'
    )
    .orderBy('sa.created_at', 'desc');
}

export async function listSectionAnnouncementsForProfessor(userId, sectionId) {
  return db('section_announcements as sa')
    .join('sections as sec', 'sec.id', 'sa.section_id')
    .join('professors as p', 'p.id', 'sec.professor_id')
    .join('users as au', 'au.id', 'sa.author_id')
    .where('p.user_id', userId)
    .andWhere('sec.id', sectionId)
    .select(
      'sa.id',
      'sa.section_id',
      'sa.author_id',
      'sa.title',
      'sa.body',
      'sa.published_at',
      'sa.created_at',
      'sa.updated_at',
      'au.first_name as author_first_name',
      'au.last_name as author_last_name'
    )
    .orderBy('sa.created_at', 'desc');
}

export async function createSectionAnnouncement({ sectionId, authorId, title, body, publishedAt = null }) {
  const [created] = await db('section_announcements')
    .insert({
      section_id: sectionId,
      author_id: authorId,
      title,
      body,
      published_at: publishedAt,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(['id', 'section_id', 'author_id', 'title', 'body', 'published_at', 'created_at', 'updated_at']);

  return created;
}

export async function listSectionAnnouncementRecipientEmails(sectionId) {
  const rows = await db('enrollments as e')
    .join('students as s', 's.id', 'e.student_id')
    .join('users as u', 'u.id', 's.user_id')
    .where('e.section_id', sectionId)
    .whereNot('e.status', 'dropped')
    .whereNotNull('u.email')
    .distinct('u.email');

  return rows.map((row) => row.email).filter(Boolean);
}

export default {
  listVisibleAnnouncements,
  markAnnouncementRead,
  createAnnouncement,
  updateAnnouncementById,
  softDeleteAnnouncementById,
  listSectionAnnouncementsForStudent,
  listSectionAnnouncementsForProfessor,
  createSectionAnnouncement,
  listSectionAnnouncementRecipientEmails,
};

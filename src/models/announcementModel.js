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

export default {
  listVisibleAnnouncements,
  markAnnouncementRead,
  createAnnouncement,
  updateAnnouncementById,
  softDeleteAnnouncementById,
};

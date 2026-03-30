import db from '../config/knex.js';

const USER_NOTIFIABLE_TYPE = 'App\\Models\\User';

function parseData(data) {
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export async function listNotificationsForUser(userId) {
  const rows = await db('notifications')
    .where({ notifiable_type: USER_NOTIFIABLE_TYPE, notifiable_id: userId })
    .orderBy('created_at', 'desc');

  return rows.map((row) => ({
    ...row,
    data: parseData(row.data),
  }));
}

export async function markNotificationRead(userId, id) {
  return db('notifications')
    .where({ notifiable_type: USER_NOTIFIABLE_TYPE, notifiable_id: userId, id })
    .update({ read_at: db.fn.now(), updated_at: db.fn.now() });
}

export async function markAllNotificationsRead(userId) {
  return db('notifications')
    .where({ notifiable_type: USER_NOTIFIABLE_TYPE, notifiable_id: userId })
    .whereNull('read_at')
    .update({ read_at: db.fn.now(), updated_at: db.fn.now() });
}

export async function deleteNotification(userId, id) {
  return db('notifications')
    .where({ notifiable_type: USER_NOTIFIABLE_TYPE, notifiable_id: userId, id })
    .del();
}

export default {
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};

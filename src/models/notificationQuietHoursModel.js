import db from '../config/knex.js';

export async function getQuietHoursByUserId(userId) {
  return db('notification_quiet_hours')
    .where({ user_id: userId })
    .select('start_time', 'end_time', 'timezone', 'is_enabled', 'updated_at')
    .first();
}

export async function upsertQuietHours(userId, payload) {
  const [row] = await db('notification_quiet_hours')
    .insert({
      user_id: userId,
      start_time: payload.start_time,
      end_time: payload.end_time,
      timezone: payload.timezone,
      is_enabled: payload.is_enabled,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .onConflict(['user_id'])
    .merge({
      start_time: db.raw('excluded.start_time'),
      end_time: db.raw('excluded.end_time'),
      timezone: db.raw('excluded.timezone'),
      is_enabled: db.raw('excluded.is_enabled'),
      updated_at: db.raw('excluded.updated_at'),
    })
    .returning(['start_time', 'end_time', 'timezone', 'is_enabled', 'updated_at']);

  return row;
}

export default {
  getQuietHoursByUserId,
  upsertQuietHours,
};

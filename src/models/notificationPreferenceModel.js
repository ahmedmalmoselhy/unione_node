import db from '../config/knex.js';

export async function listPreferencesByUserId(userId) {
  return db('notification_preferences')
    .where({ user_id: userId })
    .select('event_type', 'is_enabled', 'updated_at')
    .orderBy('event_type', 'asc');
}

export async function upsertPreferences(userId, preferences) {
  if (!preferences.length) {
    return;
  }

  const rows = preferences.map((item) => ({
    user_id: userId,
    event_type: item.event_type,
    is_enabled: item.is_enabled,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  }));

  await db('notification_preferences')
    .insert(rows)
    .onConflict(['user_id', 'event_type'])
    .merge({
      is_enabled: db.raw('excluded.is_enabled'),
      updated_at: db.raw('excluded.updated_at'),
    });
}

export default {
  listPreferencesByUserId,
  upsertPreferences,
};

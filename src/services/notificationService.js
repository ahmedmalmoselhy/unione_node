import AppError from '../utils/AppError.js';
import notificationModel from '../models/notificationModel.js';
import notificationPreferenceModel from '../models/notificationPreferenceModel.js';

const DEFAULT_EVENT_TYPES = [
  'announcement.new',
  'announcement.section',
  'enrollment.created',
  'enrollment.dropped',
  'waitlist.promoted',
  'grades.submitted',
  'attendance.session_created',
  'attendance.records_updated',
];

export async function listMyNotifications(user) {
  const items = await notificationModel.listNotificationsForUser(user.id);
  return { items };
}

export async function markNotificationAsRead(user, notificationId) {
  const updated = await notificationModel.markNotificationRead(user.id, notificationId);

  if (!updated) {
    throw new AppError('Notification not found', 404);
  }

  return { success: true };
}

export async function markAllAsRead(user) {
  await notificationModel.markAllNotificationsRead(user.id);
  return { success: true };
}

export async function removeNotification(user, notificationId) {
  const deleted = await notificationModel.deleteNotification(user.id, notificationId);

  if (!deleted) {
    throw new AppError('Notification not found', 404);
  }

  return { success: true };
}

export async function listMyNotificationPreferences(user) {
  const rows = await notificationPreferenceModel.listPreferencesByUserId(user.id);
  const map = new Map(rows.map((row) => [row.event_type, row.is_enabled]));

  const items = DEFAULT_EVENT_TYPES.map((eventType) => ({
    event_type: eventType,
    is_enabled: map.has(eventType) ? map.get(eventType) : true,
  }));

  return { items };
}

export async function updateMyNotificationPreferences(user, preferences) {
  await notificationPreferenceModel.upsertPreferences(user.id, preferences);
  return listMyNotificationPreferences(user);
}

export default {
  listMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  removeNotification,
  listMyNotificationPreferences,
  updateMyNotificationPreferences,
};

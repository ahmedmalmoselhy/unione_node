import AppError from '../utils/AppError.js';
import notificationModel from '../models/notificationModel.js';

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

export default {
  listMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  removeNotification,
};

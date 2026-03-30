import { success } from '../utils/response.js';
import notificationService from '../services/notificationService.js';

export async function listNotifications(req, res, next) {
  try {
    const result = await notificationService.listMyNotifications(req.user);
    return res.status(200).json(success(result, 'Notifications fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const result = await notificationService.markNotificationAsRead(req.user, req.params.id);
    return res.status(200).json(success(result, 'Notification marked as read', 200));
  } catch (error) {
    return next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user);
    return res.status(200).json(success(result, 'All notifications marked as read', 200));
  } catch (error) {
    return next(error);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const result = await notificationService.removeNotification(req.user, req.params.id);
    return res.status(200).json(success(result, 'Notification deleted successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function listNotificationPreferences(req, res, next) {
  try {
    const result = await notificationService.listMyNotificationPreferences(req.user);
    return res.status(200).json(success(result, 'Notification preferences fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function updateNotificationPreferences(req, res, next) {
  try {
    const result = await notificationService.updateMyNotificationPreferences(req.user, req.body.preferences);
    return res.status(200).json(success(result, 'Notification preferences updated successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function getNotificationQuietHours(req, res, next) {
  try {
    const result = await notificationService.getMyNotificationQuietHours(req.user);
    return res.status(200).json(success(result, 'Notification quiet hours fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function updateNotificationQuietHours(req, res, next) {
  try {
    const result = await notificationService.updateMyNotificationQuietHours(req.user, req.body.quiet_hours);
    return res.status(200).json(success(result, 'Notification quiet hours updated successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  listNotificationPreferences,
  updateNotificationPreferences,
  getNotificationQuietHours,
  updateNotificationQuietHours,
};

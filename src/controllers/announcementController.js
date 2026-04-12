import { success } from '../utils/response.js';
import announcementService from '../services/announcementService.js';
import { addEmail } from '../queues/emailQueue.js';
import db from '../config/knex.js';

export async function listAnnouncements(req, res, next) {
  try {
    const result = await announcementService.listAnnouncements(req.user);
    return res.status(200).json(success(result, 'Announcements fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function markAnnouncementRead(req, res, next) {
  try {
    const announcementId = Number(req.params.id);
    const result = await announcementService.markAnnouncementAsRead(req.user, announcementId);
    return res.status(200).json(success(result, 'Announcement marked as read', 200));
  } catch (error) {
    return next(error);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const result = await announcementService.createAnnouncement(req.user, req.body);
    
    // Queue email notifications to all target users
    try {
      const targetUsers = await announcementService.getTargetUsers(result);
      
      for (const user of targetUsers) {
        if (user.email) {
          await addEmail('announcement', {
            userId: user.id,
            announcement: result,
          });
        }
      }
    } catch (emailError) {
      console.error(`Failed to queue announcement emails: ${emailError.message}`);
    }
    
    return res.status(201).json(success(result, 'Announcement created successfully', 201));
  } catch (error) {
    return next(error);
  }
}

export async function updateAnnouncement(req, res, next) {
  try {
    const announcementId = Number(req.params.id);
    const result = await announcementService.updateAnnouncement(req.user, announcementId, req.body);
    return res.status(200).json(success(result, 'Announcement updated successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    const announcementId = Number(req.params.id);
    const result = await announcementService.deleteAnnouncement(req.user, announcementId);
    return res.status(200).json(success(result, 'Announcement deleted successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export default {
  listAnnouncements,
  markAnnouncementRead,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};

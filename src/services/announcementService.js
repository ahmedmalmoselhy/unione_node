import AppError from '../utils/AppError.js';
import announcementModel from '../models/announcementModel.js';

const VALID_VISIBILITY = new Set(['university', 'faculty', 'department', 'section']);
const VALID_TYPE = new Set(['general', 'academic', 'administrative', 'urgent']);

function ensureRole(roles, allowed) {
  if (!Array.isArray(roles) || !roles.some((role) => allowed.has(role.name))) {
    throw new AppError('Insufficient permissions for this action', 403);
  }
}

function normalizePayload(payload) {
  const cleaned = {};
  const allowedFields = ['title', 'body', 'type', 'visibility', 'target_id', 'published_at', 'expires_at'];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      cleaned[field] = payload[field];
    }
  }

  return cleaned;
}

function validateAnnouncementPayload(payload) {
  if (payload.type !== undefined && !VALID_TYPE.has(payload.type)) {
    throw new AppError('Invalid announcement type', 422);
  }

  if (payload.visibility !== undefined && !VALID_VISIBILITY.has(payload.visibility)) {
    throw new AppError('Invalid visibility type', 422);
  }

  if (payload.visibility === 'university') {
    payload.target_id = null;
  } else if (payload.visibility && (payload.target_id === null || payload.target_id === undefined)) {
    throw new AppError('target_id is required for scoped visibility', 422);
  }

  if (payload.published_at && payload.expires_at) {
    const published = new Date(payload.published_at);
    const expires = new Date(payload.expires_at);

    if (Number.isNaN(published.getTime()) || Number.isNaN(expires.getTime()) || expires <= published) {
      throw new AppError('expires_at must be after published_at', 422);
    }
  }
}

export async function listAnnouncements(user) {
  const items = await announcementModel.listVisibleAnnouncements(user);
  return { items };
}

export async function markAnnouncementAsRead(user, announcementId) {
  await announcementModel.markAnnouncementRead(announcementId, user.id);
  return { success: true };
}

export async function createAnnouncement(user, payload) {
  ensureRole(user.roles, new Set(['admin', 'super_admin']));

  const normalized = normalizePayload(payload);
  normalized.author_id = user.id;

  validateAnnouncementPayload(normalized);

  const created = await announcementModel.createAnnouncement(normalized);

  return created;
}

export async function updateAnnouncement(user, id, payload) {
  ensureRole(user.roles, new Set(['admin', 'super_admin']));

  const normalized = normalizePayload(payload);

  validateAnnouncementPayload(normalized);

  const updated = await announcementModel.updateAnnouncementById(id, normalized);

  if (!updated) {
    throw new AppError('Announcement not found', 404);
  }

  return updated;
}

export async function deleteAnnouncement(user, id) {
  ensureRole(user.roles, new Set(['admin', 'super_admin']));

  const deleted = await announcementModel.softDeleteAnnouncementById(id);

  if (!deleted) {
    throw new AppError('Announcement not found', 404);
  }

  return { success: true };
}

export default {
  listAnnouncements,
  markAnnouncementAsRead,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};

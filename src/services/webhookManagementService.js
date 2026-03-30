import crypto from 'node:crypto';
import webhookModel from '../models/webhookModel.js';

function toSafeWebhook(row) {
  return {
    id: row.id,
    url: row.url,
    events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
    is_active: row.is_active,
    failure_count: row.failure_count,
    last_triggered_at: row.last_triggered_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listMyWebhooks(userId) {
  const rows = await webhookModel.listWebhooksByUserId(userId);
  return rows.map(toSafeWebhook);
}

export async function createMyWebhook(userId, payload) {
  const secret = crypto.randomBytes(32).toString('hex');

  const created = await webhookModel.createWebhook({
    userId,
    url: payload.url,
    events: JSON.stringify(payload.events),
    isActive: payload.is_active ?? true,
    secret,
  });

  return {
    id: created.id,
    secret,
  };
}

export async function updateMyWebhook(userId, id, payload) {
  const patch = {};

  if (payload.url !== undefined) {
    patch.url = payload.url;
  }

  if (payload.events !== undefined) {
    patch.events = JSON.stringify(payload.events);
  }

  if (payload.is_active !== undefined) {
    patch.is_active = payload.is_active;
  }

  const updated = await webhookModel.updateWebhookByIdAndUserId(userId, id, patch);
  return Boolean(updated);
}

export async function deleteMyWebhook(userId, id) {
  const deleted = await webhookModel.deleteWebhookByIdAndUserId(userId, id);
  return deleted > 0;
}

export default {
  listMyWebhooks,
  createMyWebhook,
  updateMyWebhook,
  deleteMyWebhook,
};

import crypto from 'node:crypto';
import axios from 'axios';
import webhookModel from '../models/webhookModel.js';
import AppError from '../utils/AppError.js';

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

function signPayload(secret, payload) {
  const body = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function listMyDeadLetterDeliveries(userId, { limit = 50 } = {}) {
  const rows = await webhookModel.listDeadLetterDeliveriesByUserId(userId, Number(limit) || 50);
  return rows.map((row) => ({
    id: row.id,
    webhook_id: row.webhook_id,
    event: row.event,
    response_status: row.response_status,
    response_body: row.response_body,
    attempt: row.attempt,
    delivered_at: row.delivered_at,
    created_at: row.created_at,
  }));
}

export async function retryMyDeadLetterDelivery(userId, deliveryId) {
  const delivery = await webhookModel.getDeadLetterDeliveryByIdAndUserId(userId, deliveryId);

  if (!delivery) {
    throw new AppError('Dead-letter delivery not found', 404);
  }

  const payload = typeof delivery.payload === 'string' ? JSON.parse(delivery.payload) : delivery.payload;
  const attempt = Number(delivery.attempt || 1) + 1;
  const signature = signPayload(delivery.secret, payload);
  const deliveryUid = crypto.randomUUID();

  try {
    const response = await axios.post(delivery.url, payload, {
      timeout: 5000,
      headers: {
        'content-type': 'application/json',
        'x-unione-event': delivery.event,
        'x-unione-signature': signature,
        'x-unione-delivery-id': deliveryUid,
        'x-unione-attempt': String(attempt),
      },
    });

    await webhookModel.createWebhookDelivery({
      webhookId: delivery.webhook_id,
      event: delivery.event,
      payload,
      responseStatus: response.status,
      responseBody: typeof response.data === 'string' ? response.data.slice(0, 1000) : JSON.stringify(response.data),
      attempt,
      deliveredAt: new Date(),
    });

    await webhookModel.markWebhookSuccess(delivery.webhook_id);

    return { retried: true, success: true, response_status: response.status };
  } catch (error) {
    await webhookModel.createWebhookDelivery({
      webhookId: delivery.webhook_id,
      event: delivery.event,
      payload,
      responseStatus: error.response?.status || null,
      responseBody: error.message,
      attempt,
      deliveredAt: new Date(),
    });

    await webhookModel.incrementWebhookFailure(delivery.webhook_id);

    return { retried: true, success: false, response_status: error.response?.status || null };
  }
}

export default {
  listMyWebhooks,
  createMyWebhook,
  updateMyWebhook,
  deleteMyWebhook,
  listMyDeadLetterDeliveries,
  retryMyDeadLetterDelivery,
};

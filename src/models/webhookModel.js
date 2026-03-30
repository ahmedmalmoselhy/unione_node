import db from '../config/knex.js';

export async function listActiveWebhooksForEvent(event) {
  return db('webhooks')
    .where({ is_active: true })
    .whereRaw('jsonb_exists(events::jsonb, ?)', [event])
    .select('id', 'user_id', 'url', 'secret', 'events', 'failure_count');
}

export async function listWebhooksByUserId(userId) {
  return db('webhooks')
    .where({ user_id: userId })
    .select('id', 'url', 'events', 'is_active', 'failure_count', 'last_triggered_at', 'created_at', 'updated_at')
    .orderBy('id', 'desc');
}

export async function createWebhook({ userId, url, secret, events, isActive = true }) {
  const [created] = await db('webhooks')
    .insert({
      user_id: userId,
      url,
      secret,
      events,
      is_active: isActive,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('id');

  return created;
}

export async function updateWebhookByIdAndUserId(userId, id, payload) {
  const [updated] = await db('webhooks')
    .where({ user_id: userId, id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning('id');

  return updated;
}

export async function deleteWebhookByIdAndUserId(userId, id) {
  return db('webhooks').where({ user_id: userId, id }).del();
}

export async function createWebhookDelivery({
  webhookId,
  event,
  payload,
  responseStatus = null,
  responseBody = null,
  attempt = 1,
  deliveredAt = null,
}) {
  const [created] = await db('webhook_deliveries')
    .insert({
      webhook_id: webhookId,
      event,
      payload,
      response_status: responseStatus,
      response_body: responseBody,
      attempt,
      delivered_at: deliveredAt,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return created;
}

export async function markWebhookSuccess(webhookId) {
  await db('webhooks').where({ id: webhookId }).update({
    failure_count: 0,
    last_triggered_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
}

export async function incrementWebhookFailure(webhookId) {
  await db('webhooks')
    .where({ id: webhookId })
    .update({
      failure_count: db.raw('COALESCE(failure_count, 0) + 1'),
      last_triggered_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
}

export default {
  listActiveWebhooksForEvent,
  listWebhooksByUserId,
  createWebhook,
  updateWebhookByIdAndUserId,
  deleteWebhookByIdAndUserId,
  createWebhookDelivery,
  markWebhookSuccess,
  incrementWebhookFailure,
};

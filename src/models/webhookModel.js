import db from '../config/knex.js';

export async function listActiveWebhooksForEvent(event) {
  return db('webhooks')
    .where({ is_active: true })
    .whereRaw('jsonb_exists(events::jsonb, ?)', [event])
    .select('id', 'user_id', 'url', 'secret', 'events', 'failure_count');
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
  createWebhookDelivery,
  markWebhookSuccess,
  incrementWebhookFailure,
};

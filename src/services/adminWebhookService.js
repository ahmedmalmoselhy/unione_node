import db from '../config/knex.js';

export async function listFailedWebhookDeliveries({ limit = 50 } = {}) {
  return db('webhook_deliveries as d')
    .join('webhooks as w', 'w.id', 'd.webhook_id')
    .where((query) => {
      query.whereNull('d.response_status').orWhere('d.response_status', '>=', 400);
    })
    .select(
      'd.id',
      'd.webhook_id',
      'd.event',
      'd.response_status',
      'd.response_body',
      'd.attempt',
      'd.delivered_at',
      'd.created_at',
      'w.url as webhook_url',
      'w.user_id as webhook_user_id'
    )
    .orderBy('d.created_at', 'desc')
    .limit(Number(limit) || 50);
}

export default {
  listFailedWebhookDeliveries,
};

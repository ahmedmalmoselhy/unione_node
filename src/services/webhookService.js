import crypto from 'node:crypto';
import webhookModel from '../models/webhookModel.js';
import db from '../config/knex.js';
import { addWebhook } from '../queues/webhookQueue.js';

/**
 * Dispatch webhook event by queueing it for async delivery
 * @param {string} event - Event name
 * @param {object} payload - Event payload
 */
export async function dispatchWebhookEvent(event, payload) {
  const hasWebhooksTable = await db.schema.hasTable('webhooks');
  const hasDeliveriesTable = await db.schema.hasTable('webhook_deliveries');

  if (!hasWebhooksTable || !hasDeliveriesTable) {
    return;
  }

  const webhooks = await webhookModel.listActiveWebhooksForEvent(event);

  if (!webhooks.length) {
    return;
  }

  // Queue webhook deliveries instead of synchronous execution
  await Promise.all(
    webhooks.map(async (webhook) => {
      try {
        await addWebhook({
          webhookId: webhook.id,
          event,
          webhookUrl: webhook.url,
          payload,
          headers: webhook.headers || {},
          secret: webhook.secret,
        });
      } catch (error) {
        console.error(`Failed to queue webhook delivery: ${error.message}`);
      }
    })
  );
}

/**
 * List webhook deliveries for a user
 * @param {number} userId - User ID
 * @param {number} webhookId - Webhook ID
 * @param {number} limit - Limit
 * @returns {Promise<Array>} Deliveries
 */
export async function listWebhookDeliveries(userId, webhookId, limit = 50) {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  return webhookModel.listWebhookDeliveriesByWebhookIdAndUserId(userId, webhookId, safeLimit);
}

export default {
  dispatchWebhookEvent,
  listWebhookDeliveries,
};

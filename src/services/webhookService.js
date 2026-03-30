import axios from 'axios';
import crypto from 'node:crypto';
import webhookModel from '../models/webhookModel.js';
import db from '../config/knex.js';

function signPayload(secret, payload) {
  const body = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function computeBackoffMs(attempt) {
  const base = 200;
  return base * 2 ** (attempt - 1);
}

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

  await Promise.all(
    webhooks.map(async (webhook) => {
      const signature = signPayload(webhook.secret, payload);
      const maxAttempts = 3;
      const deliveryId = crypto.randomUUID();

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await axios.post(webhook.url, payload, {
            timeout: 5000,
            headers: {
              'content-type': 'application/json',
              'x-unione-event': event,
              'x-unione-signature': signature,
              'x-unione-delivery-id': deliveryId,
              'x-unione-attempt': String(attempt),
            },
          });

          await webhookModel.createWebhookDelivery({
            webhookId: webhook.id,
            event,
            payload,
            responseStatus: response.status,
            responseBody: typeof response.data === 'string' ? response.data.slice(0, 1000) : JSON.stringify(response.data),
            attempt,
            deliveredAt: new Date(),
          });

          await webhookModel.markWebhookSuccess(webhook.id);
          break;
        } catch (error) {
          await webhookModel.createWebhookDelivery({
            webhookId: webhook.id,
            event,
            payload,
            responseStatus: error.response?.status || null,
            responseBody: error.message,
            attempt,
            deliveredAt: new Date(),
          });

          if (attempt >= maxAttempts) {
            await webhookModel.incrementWebhookFailure(webhook.id);
            break;
          }

          await sleep(computeBackoffMs(attempt));
        }
      }
    })
  );
}

export default {
  dispatchWebhookEvent,
};

import axios from 'axios';
import crypto from 'node:crypto';
import webhookModel from '../models/webhookModel.js';
import db from '../config/knex.js';

function signPayload(secret, payload) {
  const body = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
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

      try {
        const response = await axios.post(webhook.url, payload, {
          timeout: 5000,
          headers: {
            'content-type': 'application/json',
            'x-unione-event': event,
            'x-unione-signature': signature,
          },
        });

        await webhookModel.createWebhookDelivery({
          webhookId: webhook.id,
          event,
          payload,
          responseStatus: response.status,
          responseBody: typeof response.data === 'string' ? response.data.slice(0, 1000) : JSON.stringify(response.data),
          deliveredAt: new Date(),
        });

        await webhookModel.markWebhookSuccess(webhook.id);
      } catch (error) {
        await webhookModel.createWebhookDelivery({
          webhookId: webhook.id,
          event,
          payload,
          responseStatus: error.response?.status || null,
          responseBody: error.message,
          deliveredAt: new Date(),
        });

        await webhookModel.incrementWebhookFailure(webhook.id);
      }
    })
  );
}

export default {
  dispatchWebhookEvent,
};

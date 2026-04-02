import { success } from '../utils/response.js';
import { listFailedWebhookDeliveries } from '../services/adminWebhookService.js';
import { listWebhookDeliveries } from '../services/webhookService.js';

export async function deliveries(req, res, next) {
  try {
    const webhookId = Number(req.params.webhookId);
    const limit = req.query.limit;
    const data = await listWebhookDeliveries(req.user.id, webhookId, limit);
    return res.status(200).json(success({ deliveries: data }, 'Webhook deliveries fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function failedDeliveries(req, res, next) {
  try {
    const data = await listFailedWebhookDeliveries(req.query);
    return res.status(200).json(success(data, 'Failed webhook deliveries fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

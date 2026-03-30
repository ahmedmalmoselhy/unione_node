import { success } from '../utils/response.js';
import { listFailedWebhookDeliveries } from '../services/adminWebhookService.js';

export async function failedDeliveries(req, res, next) {
  try {
    const data = await listFailedWebhookDeliveries(req.query);
    return res.status(200).json(success(data, 'Failed webhook deliveries fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

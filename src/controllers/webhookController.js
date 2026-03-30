import { success, error as errorResponse } from '../utils/response.js';
import {
  listMyWebhooks,
  createMyWebhook,
  updateMyWebhook,
  deleteMyWebhook,
} from '../services/webhookManagementService.js';

export async function listWebhooks(req, res, next) {
  try {
    const data = await listMyWebhooks(req.user.id);
    return res.status(200).json(success({ items: data }, 'Webhooks fetched successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function createWebhook(req, res, next) {
  try {
    const data = await createMyWebhook(req.user.id, req.body);
    return res.status(201).json(success(data, 'Webhook created successfully', 201));
  } catch (error) {
    return next(error);
  }
}

export async function updateWebhook(req, res, next) {
  try {
    const ok = await updateMyWebhook(req.user.id, Number(req.params.id), req.body);

    if (!ok) {
      return res.status(404).json(errorResponse('Webhook not found', 404));
    }

    return res.status(200).json(success({ updated: true }, 'Webhook updated successfully', 200));
  } catch (error) {
    return next(error);
  }
}

export async function deleteWebhook(req, res, next) {
  try {
    const ok = await deleteMyWebhook(req.user.id, Number(req.params.id));

    if (!ok) {
      return res.status(404).json(errorResponse('Webhook not found', 404));
    }

    return res.status(200).json(success({ deleted: true }, 'Webhook deleted successfully', 200));
  } catch (error) {
    return next(error);
  }
}

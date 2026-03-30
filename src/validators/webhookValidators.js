import Joi from 'joi';

export const webhookIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const createWebhookSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).required(),
  events: Joi.array().items(Joi.string().max(120)).min(1).required(),
  is_active: Joi.boolean().optional(),
});

export const updateWebhookSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).optional(),
  events: Joi.array().items(Joi.string().max(120)).min(1).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

export const deadLetterQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const deadLetterIdParamSchema = Joi.object({
  deliveryId: Joi.number().integer().positive().required(),
});

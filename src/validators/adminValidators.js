import Joi from 'joi';

export const adminAnalyticsQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
  section_id: Joi.number().integer().positive().optional(),
  course_id: Joi.number().integer().positive().optional(),
  from_date: Joi.date().iso().optional(),
  to_date: Joi.date().iso().optional(),
});

export const adminFailedWebhookQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200).optional(),
});

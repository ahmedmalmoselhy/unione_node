import Joi from 'joi';

export const adminAnalyticsQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
});

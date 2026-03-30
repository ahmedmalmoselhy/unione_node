import Joi from 'joi';

export const studentEnrollmentsQuerySchema = Joi.object({
  status: Joi.string().valid('registered', 'dropped', 'completed', 'failed', 'incomplete').optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const studentGradesQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
});

import Joi from 'joi';

export const professorSectionsQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const professorSectionIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

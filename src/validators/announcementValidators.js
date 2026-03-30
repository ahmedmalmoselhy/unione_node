import Joi from 'joi';

export const announcementIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const createAnnouncementSchema = Joi.object({
  title: Joi.string().max(255).required(),
  body: Joi.string().required(),
  type: Joi.string().valid('general', 'academic', 'administrative', 'urgent').required(),
  visibility: Joi.string().valid('university', 'faculty', 'department', 'section').required(),
  target_id: Joi.number().integer().positive().allow(null).optional(),
  published_at: Joi.date().iso().allow(null).optional(),
  expires_at: Joi.date().iso().allow(null).optional(),
});

export const updateAnnouncementSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  body: Joi.string().optional(),
  type: Joi.string().valid('general', 'academic', 'administrative', 'urgent').optional(),
  visibility: Joi.string().valid('university', 'faculty', 'department', 'section').optional(),
  target_id: Joi.number().integer().positive().allow(null).optional(),
  published_at: Joi.date().iso().allow(null).optional(),
  expires_at: Joi.date().iso().allow(null).optional(),
}).min(1);

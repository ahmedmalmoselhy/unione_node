import Joi from 'joi';

export const notificationIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

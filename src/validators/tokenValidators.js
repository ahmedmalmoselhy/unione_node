import Joi from 'joi';

export const tokenIdParamSchema = Joi.object({
  tokenId: Joi.number().integer().positive().required(),
});

import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().min(20).required(),
  password: Joi.string().min(6).required(),
  password_confirmation: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password confirmation must match password',
  }),
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().min(6).required(),
  password: Joi.string().min(6).required(),
  password_confirmation: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password confirmation must match password',
  }),
});

export const updateProfileSchema = Joi.object({
  phone: Joi.string().max(30).optional(),
  date_of_birth: Joi.date().iso().optional(),
  avatar_path: Joi.string().max(255).allow(null, '').optional(),
}).min(1);

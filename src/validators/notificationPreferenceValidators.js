import Joi from 'joi';

export const notificationPreferenceItemSchema = Joi.object({
  event_type: Joi.string().max(100).required(),
  is_enabled: Joi.boolean().required(),
});

export const updateNotificationPreferencesSchema = Joi.object({
  preferences: Joi.array().items(notificationPreferenceItemSchema).min(1).required(),
});

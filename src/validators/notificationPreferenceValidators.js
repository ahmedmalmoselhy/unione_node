import Joi from 'joi';

export const notificationPreferenceItemSchema = Joi.object({
  event_type: Joi.string().max(100).required(),
  is_enabled: Joi.boolean().required(),
});

export const updateNotificationPreferencesSchema = Joi.object({
  preferences: Joi.array().items(notificationPreferenceItemSchema).min(1).required(),
});

export const updateNotificationQuietHoursSchema = Joi.object({
  quiet_hours: Joi.object({
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    end_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    timezone: Joi.string().max(64).required(),
    is_enabled: Joi.boolean().required(),
  }).required(),
});

import Joi from 'joi';

export const facultyListSchema = Joi.object({
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false),
});

export const departmentListSchema = Joi.object({
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false),
  facultyId: Joi.number().integer().positive().optional(),
});

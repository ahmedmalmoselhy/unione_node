import Joi from 'joi';

export const adminAnalyticsQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
  section_id: Joi.number().integer().positive().optional(),
  course_id: Joi.number().integer().positive().optional(),
  from_date: Joi.date().iso().optional(),
  to_date: Joi.date().iso().optional(),
});

export const adminFailedWebhookQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminWebhookIdParamSchema = Joi.object({
  webhookId: Joi.number().integer().positive().required(),
});

export const adminExportQuerySchema = Joi.object({
  faculty_id: Joi.number().integer().positive().optional(),
  department_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('registered', 'completed', 'dropped', 'active').optional(),
});

export const adminDashboardStatsQuerySchema = Joi.object({
  faculty_id: Joi.number().integer().positive().optional(),
  department_id: Joi.number().integer().positive().optional(),
});

export const adminAuditLogsQuerySchema = Joi.object({
  action: Joi.string().valid('create', 'update', 'delete', 'assign', 'revoke', 'transfer', 'login', 'logout').optional(),
  auditable_type: Joi.string().max(191).optional(),
  search: Joi.string().max(255).optional(),
  from_date: Joi.date().iso().optional(),
  to_date: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
  page: Joi.number().integer().min(1).optional(),
});

export const adminAcademicTermSchema = Joi.object({
  name: Joi.string().max(255).required(),
  academic_year: Joi.number().integer().required(),
  semester: Joi.number().integer().valid(1, 2).required(),
  starts_at: Joi.date().iso().required(),
  ends_at: Joi.date().iso().required(),
  registration_starts_at: Joi.date().iso().required(),
  registration_ends_at: Joi.date().iso().required(),
  withdrawal_deadline: Joi.date().iso().allow(null, '').optional(),
  is_active: Joi.boolean().default(false),
});

export const adminAcademicTermUpdateSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  academic_year: Joi.number().integer().optional(),
  semester: Joi.number().integer().valid(1, 2).optional(),
  starts_at: Joi.date().iso().optional(),
  ends_at: Joi.date().iso().optional(),
  registration_starts_at: Joi.date().iso().optional(),
  registration_ends_at: Joi.date().iso().optional(),
  withdrawal_deadline: Joi.date().iso().allow(null, '').optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

export const adminProfessorListQuerySchema = Joi.object({
  search: Joi.string().max(255).optional(),
  faculty_id: Joi.number().integer().positive().optional(),
  department_id: Joi.number().integer().positive().optional(),
  academic_rank: Joi.string().valid('lecturer', 'assistant_professor', 'associate_professor', 'professor').optional(),
  is_active: Joi.boolean().truthy('true').falsy('false').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminProfessorCreateSchema = Joi.object({
  national_id: Joi.string().max(30).required(),
  first_name: Joi.string().max(255).required(),
  last_name: Joi.string().max(255).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).required(),
  password_confirmation: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password confirmation must match password',
  }),
  phone: Joi.string().max(30).allow(null, '').optional(),
  gender: Joi.string().valid('male', 'female').required(),
  date_of_birth: Joi.date().iso().allow(null).optional(),
  is_active: Joi.boolean().default(true),
  staff_number: Joi.string().max(50).required(),
  department_id: Joi.number().integer().positive().required(),
  specialization: Joi.string().max(255).required(),
  academic_rank: Joi.string().valid('lecturer', 'assistant_professor', 'associate_professor', 'professor').required(),
  office_location: Joi.string().max(255).allow(null, '').optional(),
  hired_at: Joi.date().iso().required(),
});

export const adminProfessorUpdateSchema = Joi.object({
  national_id: Joi.string().max(30).optional(),
  first_name: Joi.string().max(255).optional(),
  last_name: Joi.string().max(255).optional(),
  email: Joi.string().email().max(255).optional(),
  password: Joi.string().min(8).optional(),
  password_confirmation: Joi.any().when('password', {
    is: Joi.exist(),
    then: Joi.valid(Joi.ref('password')).required().messages({
      'any.only': 'Password confirmation must match password',
    }),
    otherwise: Joi.forbidden(),
  }),
  phone: Joi.string().max(30).allow(null, '').optional(),
  gender: Joi.string().valid('male', 'female').optional(),
  date_of_birth: Joi.date().iso().allow(null).optional(),
  is_active: Joi.boolean().optional(),
  staff_number: Joi.string().max(50).optional(),
  department_id: Joi.number().integer().positive().optional(),
  specialization: Joi.string().max(255).optional(),
  academic_rank: Joi.string().valid('lecturer', 'assistant_professor', 'associate_professor', 'professor').optional(),
  office_location: Joi.string().max(255).allow(null, '').optional(),
  hired_at: Joi.date().iso().optional(),
}).min(1);

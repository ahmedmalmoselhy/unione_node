import Joi from 'joi';

export const facultyListSchema = Joi.object({
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false),
});

export const departmentListSchema = Joi.object({
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false),
  facultyId: Joi.number().integer().positive().optional(),
});

export const entityIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const updateUniversitySchema = Joi.object({
  name: Joi.string().max(255).optional(),
  name_ar: Joi.string().max(255).optional(),
  address: Joi.string().max(1000).optional(),
  logo_path: Joi.string().max(255).allow(null, '').optional(),
  established_at: Joi.date().iso().allow(null).optional(),
  phone: Joi.string().max(30).allow(null, '').optional(),
  email: Joi.string().email().allow(null, '').optional(),
  website: Joi.string().uri().allow(null, '').optional(),
}).min(1);

export const createFacultySchema = Joi.object({
  name: Joi.string().max(255).required(),
  name_ar: Joi.string().max(255).required(),
  code: Joi.string().max(100).required(),
  enrollment_type: Joi.string().valid('immediate', 'none', 'deferred').required(),
  dean_id: Joi.number().integer().positive().allow(null).optional(),
  is_active: Joi.boolean().default(true),
  logo_path: Joi.string().max(255).allow(null, '').optional(),
});

export const updateFacultySchema = Joi.object({
  name: Joi.string().max(255).optional(),
  name_ar: Joi.string().max(255).optional(),
  code: Joi.string().max(100).optional(),
  enrollment_type: Joi.string().valid('immediate', 'none', 'deferred').optional(),
  dean_id: Joi.number().integer().positive().allow(null).optional(),
  is_active: Joi.boolean().optional(),
  logo_path: Joi.string().max(255).allow(null, '').optional(),
}).min(1);

export const createDepartmentSchema = Joi.object({
  faculty_id: Joi.number().integer().positive().allow(null).required(),
  name: Joi.string().max(255).required(),
  name_ar: Joi.string().max(255).required(),
  code: Joi.string().max(100).required(),
  type: Joi.string().valid('academic', 'managerial').required(),
  scope: Joi.string().valid('university', 'faculty').default('faculty'),
  is_preparatory: Joi.boolean().default(false),
  is_mandatory: Joi.boolean().default(false),
  required_credit_hours: Joi.number().integer().min(0).allow(null).optional(),
  head_id: Joi.number().integer().positive().allow(null).optional(),
  is_active: Joi.boolean().default(true),
  logo_path: Joi.string().max(255).allow(null, '').optional(),
});

export const updateDepartmentSchema = Joi.object({
  faculty_id: Joi.number().integer().positive().allow(null).optional(),
  name: Joi.string().max(255).optional(),
  name_ar: Joi.string().max(255).optional(),
  code: Joi.string().max(100).optional(),
  type: Joi.string().valid('academic', 'managerial').optional(),
  scope: Joi.string().valid('university', 'faculty').optional(),
  is_preparatory: Joi.boolean().optional(),
  is_mandatory: Joi.boolean().optional(),
  required_credit_hours: Joi.number().integer().min(0).allow(null).optional(),
  head_id: Joi.number().integer().positive().allow(null).optional(),
  is_active: Joi.boolean().optional(),
  logo_path: Joi.string().max(255).allow(null, '').optional(),
}).min(1);

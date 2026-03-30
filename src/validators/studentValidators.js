import Joi from 'joi';

export const studentEnrollmentsQuerySchema = Joi.object({
  status: Joi.string().valid('registered', 'dropped', 'completed', 'failed', 'incomplete').optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const studentGradesQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const studentAttendanceQuerySchema = Joi.object({
  section_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const studentRatingsQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const studentRatingCreateSchema = Joi.object({
  enrollment_id: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(4000).allow(null, '').optional(),
});

export const studentEnrollSchema = Joi.object({
  section_id: Joi.number().integer().positive().required(),
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const studentEnrollmentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const studentWaitlistSectionParamSchema = Joi.object({
  sectionId: Joi.number().integer().positive().required(),
});

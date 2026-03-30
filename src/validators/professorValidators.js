import Joi from 'joi';

export const professorSectionsQuerySchema = Joi.object({
  academic_term_id: Joi.number().integer().positive().optional(),
});

export const professorSectionIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const professorSectionAndSessionParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  sessionId: Joi.number().integer().positive().required(),
});

export const submitSectionGradesSchema = Joi.object({
  grades: Joi.array()
    .items(
      Joi.object({
        enrollment_id: Joi.number().integer().positive().required(),
        midterm: Joi.number().min(0).max(100).optional(),
        final: Joi.number().min(0).max(100).optional(),
        coursework: Joi.number().min(0).max(100).optional(),
      })
    )
    .min(1)
    .required(),
});

export const createAttendanceSessionSchema = Joi.object({
  session_date: Joi.date().iso().required(),
  topic: Joi.string().max(255).allow(null, '').optional(),
});

export const updateAttendanceSessionSchema = Joi.object({
  records: Joi.array()
    .items(
      Joi.object({
        student_id: Joi.number().integer().positive().required(),
        status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
        note: Joi.string().max(255).allow(null, '').optional(),
      })
    )
    .min(1)
    .required(),
});

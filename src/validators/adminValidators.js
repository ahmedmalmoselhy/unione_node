import Joi from 'joi';
import { entityIdParamSchema } from './organizationValidators.js';

export { entityIdParamSchema };

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

export const adminCourseListQuerySchema = Joi.object({
  search: Joi.string().max(255).optional(),
  department_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().truthy('true').falsy('false').optional(),
  is_elective: Joi.boolean().truthy('true').falsy('false').optional(),
  level: Joi.number().integer().min(1).max(20).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminCourseCreateSchema = Joi.object({
  code: Joi.string().max(100).required(),
  name: Joi.string().max(255).required(),
  name_ar: Joi.string().max(255).required(),
  description: Joi.string().allow(null, '').optional(),
  credit_hours: Joi.number().integer().min(0).required(),
  lecture_hours: Joi.number().integer().min(0).required(),
  lab_hours: Joi.number().integer().min(0).default(0),
  level: Joi.number().integer().min(1).max(20).required(),
  is_elective: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true),
  department_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  owner_department_id: Joi.number().integer().positive().optional(),
});

export const adminCourseUpdateSchema = Joi.object({
  code: Joi.string().max(100).optional(),
  name: Joi.string().max(255).optional(),
  name_ar: Joi.string().max(255).optional(),
  description: Joi.string().allow(null, '').optional(),
  credit_hours: Joi.number().integer().min(0).optional(),
  lecture_hours: Joi.number().integer().min(0).optional(),
  lab_hours: Joi.number().integer().min(0).optional(),
  level: Joi.number().integer().min(1).max(20).optional(),
  is_elective: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
  department_ids: Joi.array().items(Joi.number().integer().positive()).min(1).optional(),
  owner_department_id: Joi.number().integer().positive().allow(null).optional(),
}).min(1);

export const adminSectionListQuerySchema = Joi.object({
  search: Joi.string().max(255).optional(),
  course_id: Joi.number().integer().positive().optional(),
  professor_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().truthy('true').falsy('false').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminSectionCreateSchema = Joi.object({
  course_id: Joi.number().integer().positive().required(),
  professor_id: Joi.number().integer().positive().required(),
  academic_term_id: Joi.number().integer().positive().allow(null).optional(),
  capacity: Joi.number().integer().min(1).required(),
  room: Joi.string().max(255).allow(null, '').optional(),
  schedule: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null).optional(),
  is_active: Joi.boolean().default(true),
});

export const adminSectionUpdateSchema = Joi.object({
  course_id: Joi.number().integer().positive().optional(),
  professor_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().allow(null).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  room: Joi.string().max(255).allow(null, '').optional(),
  schedule: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

export const adminSectionTeachingAssistantCreateSchema = Joi.object({
  professor_id: Joi.number().integer().positive().required(),
});

export const adminSectionTeachingAssistantDeleteParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  taId: Joi.number().integer().positive().required(),
});

export const adminSectionExamScheduleCreateSchema = Joi.object({
  exam_date: Joi.date().iso().required(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  location: Joi.string().max(255).allow(null, '').optional(),
});

export const adminSectionExamScheduleUpdateSchema = Joi.object({
  exam_date: Joi.date().iso().optional(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  location: Joi.string().max(255).allow(null, '').optional(),
}).min(1);

export const adminSectionGroupProjectParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  projectId: Joi.number().integer().positive().required(),
});

export const adminSectionGroupProjectCreateSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().allow(null, '').optional(),
  due_at: Joi.date().iso().allow(null).optional(),
  max_members: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional(),
});

export const adminSectionGroupProjectUpdateSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().allow(null, '').optional(),
  due_at: Joi.date().iso().allow(null).optional(),
  max_members: Joi.number().integer().min(1).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

export const adminSectionGroupProjectMemberCreateSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
});

export const adminSectionGroupProjectMemberDeleteParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  projectId: Joi.number().integer().positive().required(),
  memberId: Joi.number().integer().positive().required(),
});

export const adminStudentListQuerySchema = Joi.object({
  search: Joi.string().max(255).optional(),
  faculty_id: Joi.number().integer().positive().optional(),
  department_id: Joi.number().integer().positive().optional(),
  enrollment_status: Joi.string().valid('active', 'suspended', 'graduated', 'withdrawn').optional(),
  is_active: Joi.boolean().truthy('true').falsy('false').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminStudentCreateSchema = Joi.object({
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
  student_number: Joi.string().max(50).required(),
  faculty_id: Joi.number().integer().positive().required(),
  department_id: Joi.number().integer().positive().allow(null).optional(),
  academic_year: Joi.number().integer().min(1).max(20).default(1),
  semester: Joi.string().valid('first', 'second', 'summer').default('first'),
  enrollment_status: Joi.string().valid('active', 'suspended', 'graduated', 'withdrawn').default('active'),
  gpa: Joi.number().min(0).max(4).allow(null).optional(),
  academic_standing: Joi.string().valid('good_standing', 'probation', 'dismissal').allow(null).optional(),
  enrolled_at: Joi.date().iso().required(),
  graduated_at: Joi.date().iso().allow(null).optional(),
});

export const adminStudentUpdateSchema = Joi.object({
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
  student_number: Joi.string().max(50).optional(),
  faculty_id: Joi.number().integer().positive().optional(),
  department_id: Joi.number().integer().positive().allow(null).optional(),
  academic_year: Joi.number().integer().min(1).max(20).optional(),
  semester: Joi.string().valid('first', 'second', 'summer').optional(),
  enrollment_status: Joi.string().valid('active', 'suspended', 'graduated', 'withdrawn').optional(),
  gpa: Joi.number().min(0).max(4).allow(null).optional(),
  academic_standing: Joi.string().valid('good_standing', 'probation', 'dismissal').allow(null).optional(),
  enrolled_at: Joi.date().iso().optional(),
  graduated_at: Joi.date().iso().allow(null).optional(),
}).min(1);

export const adminStudentTransferSchema = Joi.object({
  to_department_id: Joi.number().integer().positive().required(),
  note: Joi.string().max(1000).allow(null, '').optional(),
});

export const adminEmployeeListQuerySchema = Joi.object({
  search: Joi.string().max(255).optional(),
  department_id: Joi.number().integer().positive().optional(),
  employment_type: Joi.string().valid('full_time', 'part_time', 'contract').optional(),
  is_active: Joi.boolean().truthy('true').falsy('false').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminEmployeeCreateSchema = Joi.object({
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
  job_title: Joi.string().max(255).required(),
  employment_type: Joi.string().valid('full_time', 'part_time', 'contract').required(),
  salary: Joi.number().min(0).allow(null).optional(),
  hired_at: Joi.date().iso().required(),
  terminated_at: Joi.date().iso().allow(null).optional(),
});

export const adminEmployeeUpdateSchema = Joi.object({
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
  job_title: Joi.string().max(255).optional(),
  employment_type: Joi.string().valid('full_time', 'part_time', 'contract').optional(),
  salary: Joi.number().min(0).allow(null).optional(),
  hired_at: Joi.date().iso().optional(),
  terminated_at: Joi.date().iso().allow(null).optional(),
}).min(1);

export const adminEnrollmentListQuerySchema = Joi.object({
  search: Joi.string().max(255).optional(),
  student_id: Joi.number().integer().positive().optional(),
  section_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('registered', 'dropped', 'completed', 'failed', 'incomplete').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminEnrollmentCreateSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
  section_id: Joi.number().integer().positive().required(),
  academic_term_id: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().valid('registered', 'dropped', 'completed', 'failed', 'incomplete').default('registered'),
  registered_at: Joi.date().iso().optional(),
  dropped_at: Joi.date().iso().allow(null).optional(),
});

export const adminEnrollmentUpdateSchema = Joi.object({
  student_id: Joi.number().integer().positive().optional(),
  section_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().valid('registered', 'dropped', 'completed', 'failed', 'incomplete').optional(),
  registered_at: Joi.date().iso().optional(),
  dropped_at: Joi.date().iso().allow(null).optional(),
}).min(1);

export const adminGradeListQuerySchema = Joi.object({
  search: Joi.string().max(255).optional(),
  enrollment_id: Joi.number().integer().positive().optional(),
  student_id: Joi.number().integer().positive().optional(),
  section_id: Joi.number().integer().positive().optional(),
  academic_term_id: Joi.number().integer().positive().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
});

export const adminGradeCreateSchema = Joi.object({
  enrollment_id: Joi.number().integer().positive().required(),
  midterm: Joi.number().min(0).max(100).allow(null).optional(),
  final: Joi.number().min(0).max(100).allow(null).optional(),
  coursework: Joi.number().min(0).max(100).allow(null).optional(),
  total: Joi.number().min(0).max(100).allow(null).optional(),
  letter_grade: Joi.string().max(3).allow(null, '').optional(),
  grade_points: Joi.number().min(0).max(4).allow(null).optional(),
  graded_at: Joi.date().iso().allow(null).optional(),
});

export const adminGradeUpdateSchema = Joi.object({
  midterm: Joi.number().min(0).max(100).allow(null).optional(),
  final: Joi.number().min(0).max(100).allow(null).optional(),
  coursework: Joi.number().min(0).max(100).allow(null).optional(),
  total: Joi.number().min(0).max(100).allow(null).optional(),
  letter_grade: Joi.string().max(3).allow(null, '').optional(),
  grade_points: Joi.number().min(0).max(4).allow(null).optional(),
  graded_at: Joi.date().iso().allow(null).optional(),
}).min(1);

export const adminAssignUserSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
});

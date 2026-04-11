import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../utils/validator.js';
import {
	index,
	show,
	store,
	update,
	destroy,
	listTeachingAssistants,
	storeTeachingAssistant,
	destroyTeachingAssistant,
	showExamSchedule,
	storeExamSchedule,
	updateExamSchedule,
	publishExamSchedule,
} from '../controllers/adminSectionController.js';
import {
	entityIdParamSchema,
	adminSectionListQuerySchema,
	adminSectionCreateSchema,
	adminSectionUpdateSchema,
	adminSectionTeachingAssistantCreateSchema,
	adminSectionTeachingAssistantDeleteParamSchema,
	adminSectionExamScheduleCreateSchema,
	adminSectionExamScheduleUpdateSchema,
} from '../validators/adminValidators.js';

const router = express.Router();
const adminScopedRoles = ['admin', 'university_admin', 'faculty_admin', 'department_admin'];

router.use(apiLimiter);
router.use(authenticate, authorizeAny(...adminScopedRoles));

router.get('/', validate(adminSectionListQuerySchema, 'query'), index);
router.get('/:id', validate(entityIdParamSchema, 'params'), show);
router.post('/', writeLimiter, validate(adminSectionCreateSchema), store);
router.patch('/:id', writeLimiter, validate(entityIdParamSchema, 'params'), validate(adminSectionUpdateSchema), update);
router.delete('/:id', writeLimiter, validate(entityIdParamSchema, 'params'), destroy);
router.get('/:id/teaching-assistants', validate(entityIdParamSchema, 'params'), listTeachingAssistants);
router.post(
	'/:id/teaching-assistants',
	writeLimiter,
	validate(entityIdParamSchema, 'params'),
	validate(adminSectionTeachingAssistantCreateSchema),
	storeTeachingAssistant,
);
router.delete(
	'/:id/teaching-assistants/:taId',
	writeLimiter,
	validate(adminSectionTeachingAssistantDeleteParamSchema, 'params'),
	destroyTeachingAssistant,
);
router.get('/:id/exam-schedule', validate(entityIdParamSchema, 'params'), showExamSchedule);
router.post(
	'/:id/exam-schedule',
	writeLimiter,
	validate(entityIdParamSchema, 'params'),
	validate(adminSectionExamScheduleCreateSchema),
	storeExamSchedule,
);
router.patch(
	'/:id/exam-schedule',
	writeLimiter,
	validate(entityIdParamSchema, 'params'),
	validate(adminSectionExamScheduleUpdateSchema),
	updateExamSchedule,
);
router.post('/:id/exam-schedule/publish', writeLimiter, validate(entityIdParamSchema, 'params'), publishExamSchedule);

export default router;
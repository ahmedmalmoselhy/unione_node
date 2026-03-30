import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { authorizeAny } from '../middleware/authorize.js';
import { validate } from '../utils/validator.js';
import {
  profile,
  sections,
  schedule,
  sectionStudents,
  sectionGrades,
} from '../controllers/professorController.js';
import {
  professorSectionsQuerySchema,
  professorSectionIdParamSchema,
} from '../validators/professorValidators.js';

const router = express.Router();

router.use(authenticate, authorizeAny('professor'));

router.get('/profile', profile);
router.get('/sections', validate(professorSectionsQuerySchema, 'query'), sections);
router.get('/schedule', validate(professorSectionsQuerySchema, 'query'), schedule);
router.get('/sections/:id/students', validate(professorSectionIdParamSchema, 'params'), sectionStudents);
router.get('/sections/:id/grades', validate(professorSectionIdParamSchema, 'params'), sectionGrades);

export default router;

// src/routes/grade.routes.js
import { Router } from 'express';
import * as gradeCtrl from '../controllers/grade.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createGradeSchema,
  updateGradeSchema,
  gradeIdSchema,
} from '../validation/grade.validation.js';

const router = Router();

router.get('/', authenticate, gradeCtrl.getAllGrades);
router.post(
  '/',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(createGradeSchema),
  gradeCtrl.createGrade
);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(updateGradeSchema),
  gradeCtrl.updateGrade
);

router.get('/by-student/:studentId', authenticate, gradeCtrl.getByStudent);
router.get('/by-course/:courseId', authenticate, gradeCtrl.getByCourse);

export default router;
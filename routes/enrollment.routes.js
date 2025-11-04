// src/routes/enrollment.routes.js
import { Router } from 'express';
import * as enrollmentCtrl from '../controllers/enrollment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createEnrollmentSchema,
  enrollmentIdSchema,
} from '../validation/enrollment.validation.js';

const router = Router();

router.get('/', authenticate, enrollmentCtrl.getAllEnrollments);
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER'),
  validate(createEnrollmentSchema),
  enrollmentCtrl.createEnrollment
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER'),
  validate(enrollmentIdSchema),
  enrollmentCtrl.deleteEnrollment
);

export default router;
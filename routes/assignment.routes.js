// src/routes/assignment.routes.js
import { Router } from 'express';
import * as assignmentCtrl from '../controllers/assignment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentIdSchema,
} from '../validation/assignment.validation.js';

const router = Router();

router.get('/', authenticate, assignmentCtrl.getAllAssignments);
router.post(
  '/',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(createAssignmentSchema),
  assignmentCtrl.createAssignment
);
router.get('/:id', authenticate, assignmentCtrl.getAssignmentById);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(updateAssignmentSchema),
  assignmentCtrl.updateAssignment
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(assignmentIdSchema),
  assignmentCtrl.deleteAssignment
);

router.get('/:id/submissions', authenticate, assignmentCtrl.getSubmissions);

export default router;
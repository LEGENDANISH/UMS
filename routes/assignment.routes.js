// src/routes/assignment.routes.js
import { Router } from 'express';
import * as assignmentCtrl from '../controllers/assignment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Public routes
router.get('/', assignmentCtrl.getAllAssignments);
router.get('/:id', assignmentCtrl.getAssignmentById);

// Protected routes (Teacher only)
router.post(
  '/',
  authenticate,
  authorizeRoles('TEACHER'),
  assignmentCtrl.createAssignment
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('TEACHER'),
  assignmentCtrl.updateAssignment
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('TEACHER'),
  assignmentCtrl.deleteAssignment
);

// Submissions (Teacher or Authenticated users)
router.get('/:id/submissions', authenticate, assignmentCtrl.getSubmissions);

export default router;

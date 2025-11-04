// src/routes/leave.routes.js
import { Router } from 'express';
import * as leaveCtrl from '../controllers/leave.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createLeaveSchema,
  reviewLeaveSchema,
  leaveIdSchema,
  studentIdParamSchema,
} from '../validation/leave.validation.js';

const router = Router();

// Student: apply for leave
router.post(
  '/leave-applications',
  authenticate,
  authorizeRoles('STUDENT'),
  validate(createLeaveSchema),
  leaveCtrl.applyForLeave
);

// Admin/Teacher: review leave
router.patch(
  '/leave-applications/:id',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER'),
  validate(reviewLeaveSchema),
  leaveCtrl.reviewLeave
);

// Read routes
router.get('/leave-applications', authenticate, leaveCtrl.getAllLeaves);
router.get(
  '/leave-applications/by-student/:studentId',
  authenticate,
  validate(studentIdParamSchema),
  leaveCtrl.getByStudent
);
router.get('/leave-applications/pending', authenticate, leaveCtrl.getPendingLeaves);

// Optional: delete (e.g., student cancels before review)
router.delete(
  '/leave-applications/:id',
  authenticate,
  validate(leaveIdSchema),
  leaveCtrl.deleteLeave
);

export default router;
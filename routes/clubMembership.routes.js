// src/routes/clubMembership.routes.js
import { Router } from 'express';
import * as membershipCtrl from '../controllers/clubMembership.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createMembershipSchema,
  updateMembershipSchema,
  membershipIdSchema,
  studentIdParamSchema,
} from '../validation/clubMembership.validation.js';

const router = Router();

// Student: join a club
router.post(
  '/club-memberships',
  authenticate,
  authorizeRoles('STUDENT'),
  validate(createMembershipSchema),
  membershipCtrl.joinClub
);

// Admin/Coordinator: update role or status
router.patch(
  '/club-memberships/:id',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER', 'CLUB_COORDINATOR'),
  validate(updateMembershipSchema),
  membershipCtrl.updateMembership
);

// Admin/Coordinator or self: leave/remove
router.delete(
  '/club-memberships/:id',
  authenticate,
  validate(membershipIdSchema),
  membershipCtrl.leaveClub
);

// Get clubs a student is in
router.get(
  '/students/:studentId/clubs',
  authenticate,
  validate(studentIdParamSchema),
  membershipCtrl.getStudentClubs
);

export default router;
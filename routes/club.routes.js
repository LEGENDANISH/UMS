// src/routes/club.routes.js
import { Router } from 'express';
import * as clubCtrl from '../controllers/club.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createClubSchema,
  updateClubSchema,
  clubIdSchema,
} from '../validation/club.validation.js';

const router = Router();

router.get('/', authenticate, clubCtrl.getAllClubs);
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER', 'CLUB_COORDINATOR'),
  validate(createClubSchema),
  clubCtrl.createClub
);
router.get('/:id', authenticate, validate(clubIdSchema), clubCtrl.getClubById);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER', 'CLUB_COORDINATOR'),
  validate(updateClubSchema),
  clubCtrl.updateClub
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(clubIdSchema),
  clubCtrl.deleteClub
);

// Relations
router.get('/:id/members', authenticate, validate(clubIdSchema), clubCtrl.getMembers);
router.get('/:id/events', authenticate, validate(clubIdSchema), clubCtrl.getEvents);
router.get('/:id/budgets', authenticate, validate(clubIdSchema), clubCtrl.getBudgets);

export default router;
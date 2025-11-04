// src/routes/eventParticipation.routes.js
import { Router } from 'express';
import * as participationCtrl from '../controllers/eventParticipation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  registerForEventSchema,
  markAttendedSchema,
  eventIdParamSchema,
  studentIdParamSchema,
} from '../validation/eventParticipation.validation.js';

const router = Router();

// Student: register for event
router.post(
  '/event-participations',
  authenticate,
  authorizeRoles('STUDENT'),
  validate(registerForEventSchema),
  participationCtrl.registerForEvent
);

// Teacher/Admin: mark attendance
router.patch(
  '/event-participations/:id',
  authenticate,
  authorizeRoles('TEACHER', 'ADMIN', 'CLUB_COORDINATOR'),
  validate(markAttendedSchema),
  participationCtrl.markAsAttended
);

// Read routes
router.get(
  '/event-participations/by-event/:eventId',
  authenticate,
  validate(eventIdParamSchema),
  participationCtrl.getByEvent
);
router.get(
  '/event-participations/by-student/:studentId',
  authenticate,
  validate(studentIdParamSchema),
  participationCtrl.getByStudent
);

export default router;
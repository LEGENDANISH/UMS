// src/routes/timetable.routes.js
import { Router } from 'express';
import * as timetableCtrl from '../controllers/timetable.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTimetableSchema,
  updateTimetableSchema,
  timetableIdSchema,
  dayOfWeekParamSchema,
} from '../validation/timetable.validation.js';

const router = Router();

router.get('/', authenticate, timetableCtrl.getAllTimetables);
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER'),
  validate(createTimetableSchema),
  timetableCtrl.createTimetable
);
router.get('/:id', authenticate, validate(timetableIdSchema), timetableCtrl.getTimetableById);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER'),
  validate(updateTimetableSchema),
  timetableCtrl.updateTimetable
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(timetableIdSchema),
  timetableCtrl.deleteTimetable
);

// Query routes
router.get('/by-course/:courseId', authenticate, timetableCtrl.getByCourse);
router.get('/by-day/:dayOfWeek', authenticate, validate(dayOfWeekParamSchema), timetableCtrl.getByDay);

export default router;
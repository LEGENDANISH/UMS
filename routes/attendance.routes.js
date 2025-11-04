// src/routes/attendance.routes.js
import { Router } from 'express';
import * as attendanceCtrl from '../controllers/attendance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  attendanceIdSchema,
} from '../validation/attendance.validation.js';

const router = Router();

router.get('/', authenticate, attendanceCtrl.getAllAttendances);
router.post(
  '/',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(createAttendanceSchema),
  attendanceCtrl.markAttendance
);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(updateAttendanceSchema),
  attendanceCtrl.updateAttendance
);

// Query routes
router.get('/by-course/:courseId', authenticate, attendanceCtrl.getByCourse);
router.get('/by-student/:studentId', authenticate, attendanceCtrl.getByStudent);

export default router;
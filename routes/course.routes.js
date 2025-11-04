// src/routes/course.routes.js
import { Router } from 'express';
import * as courseCtrl from '../controllers/course.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseIdSchema,
  getCoursesQuerySchema,
} from '../validation/course.validation.js';

const router = Router();

// Public (authenticated) or admin/teacher access
router.get(
  '/',
  authenticate,
  validate(getCoursesQuerySchema),
  courseCtrl.getAllCourses
);

router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER'),
  validate(createCourseSchema),
  courseCtrl.createCourse
);

router.get(
  '/:id',
  authenticate,
  validate(courseIdSchema),
  courseCtrl.getCourseById
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'TEACHER'),
  validate(updateCourseSchema),
  courseCtrl.updateCourse
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(courseIdSchema),
  courseCtrl.deleteCourse
);

// Relations
router.get('/:id/enrollments', authenticate, validate(courseIdSchema), courseCtrl.getEnrollments);
router.get('/:id/attendances', authenticate, validate(courseIdSchema), courseCtrl.getAttendances);
router.get('/:id/grades', authenticate, validate(courseIdSchema), courseCtrl.getGrades);
router.get('/:id/assignments', authenticate, validate(courseIdSchema), courseCtrl.getAssignments);
router.get('/:id/timetable', authenticate, validate(courseIdSchema), courseCtrl.getTimetable);

export default router;
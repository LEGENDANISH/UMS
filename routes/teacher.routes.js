// src/routes/teacher.routes.js
import { Router } from 'express';
import * as teacherCtrl from '../controllers/teacher.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Admin-only routes
router.get('/', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), teacherCtrl.getAllTeachers);
router.post('/', authenticate, authorizeRoles('ADMIN'), teacherCtrl.createTeacher);

// Self or admin/management access
router.get('/:id', authenticate, teacherCtrl.getTeacherById);
router.patch('/:id', authenticate, teacherCtrl.updateTeacher);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), teacherCtrl.deleteTeacher);

// Teacher-specific relations
router.get('/:id/courses', authenticate, teacherCtrl.getCourses);
router.get('/:id/attendances', authenticate, teacherCtrl.getAttendances);
router.get('/:id/grades', authenticate, teacherCtrl.getGrades);
router.get('/:id/assignments', authenticate, teacherCtrl.getAssignments);
router.get('/:id/clubs-managed', authenticate, teacherCtrl.getClubsManaged);

export default router;
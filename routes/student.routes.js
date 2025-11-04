// src/routes/student.routes.js
import { Router } from 'express';
import * as studentCtrl from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Public (but authenticated) or role-restricted routes
router.get('/', authenticate, authorizeRoles('ADMIN', 'TEACHER'), studentCtrl.getAllStudents);
router.post('/', authenticate, authorizeRoles('ADMIN'), studentCtrl.createStudent);

router.get('/:id', authenticate, studentCtrl.getStudentById); // Self or admin/teacher
router.patch('/:id', authenticate, studentCtrl.updateStudent); // Self (limited) or admin
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), studentCtrl.deleteStudent);

// Sub-resources (relations)
router.get('/:id/enrollments', authenticate, studentCtrl.getEnrollments);
router.get('/:id/attendances', authenticate, studentCtrl.getAttendances);
router.get('/:id/grades', authenticate, studentCtrl.getGrades);
router.get('/:id/fee-records', authenticate, studentCtrl.getFeeRecords);
router.get('/:id/borrow-records', authenticate, studentCtrl.getBorrowRecords);
router.get('/:id/club-memberships', authenticate, studentCtrl.getClubMemberships);
router.get('/:id/leave-applications', authenticate, studentCtrl.getLeaveApplications);
router.get('/:id/assignments', authenticate, studentCtrl.getAssignmentSubmissions);

export default router;
import { Router } from 'express';
import * as studentCtrl from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// ✅ "Me" routes (must come first)
router.get('/me', authenticate, studentCtrl.getMyProfile);
router.get('/me/enrollments', authenticate, studentCtrl.getMyEnrollments);
router.get('/me/attendances', authenticate, studentCtrl.getMyAttendances);
router.get('/me/grades', authenticate, studentCtrl.getMyGrades);
router.get('/me/fee-records', authenticate, studentCtrl.getMyFeeRecords);
router.get('/me/borrow-records', authenticate, studentCtrl.getMyBorrowRecords);
router.get('/me/club-memberships', authenticate, studentCtrl.getMyClubMemberships);
router.get('/me/leave-applications', authenticate, studentCtrl.getMyLeaveApplications);
router.get('/me/assignments', authenticate, studentCtrl.getMyAssignments);

// ✅ Admin/teacher and generic student routes
router.get('/', authenticate, authorizeRoles('ADMIN', 'TEACHER'), studentCtrl.getAllStudents);
router.post('/', authenticate, authorizeRoles('ADMIN'), studentCtrl.signup);
router.post('/login', studentCtrl.login);

router.get('/:id', authenticate, studentCtrl.getStudentById);
router.patch('/:id', authenticate, studentCtrl.updateStudent);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), studentCtrl.deleteStudent);

// ✅ Sub-resources (keep below /me routes)
router.get('/:id/enrollments', authenticate, studentCtrl.getEnrollments);
router.get('/:id/attendances', authenticate, studentCtrl.getAttendances);
router.get('/:id/grades', authenticate, studentCtrl.getGrades);
router.get('/:id/fee-records', authenticate, studentCtrl.getFeeRecords);
router.get('/:id/borrow-records', authenticate, studentCtrl.getBorrowRecords);
router.get('/:id/club-memberships', authenticate, studentCtrl.getClubMemberships);
router.get('/:id/leave-applications', authenticate, studentCtrl.getLeaveApplications);
router.get('/:id/assignments', authenticate, studentCtrl.getAssignmentSubmissions);

export default router;

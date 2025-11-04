// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json()); // ✅ this line is essential

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Route Imports ---
// Authentication & User Management
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

// Student Management
import studentRoutes from './routes/student.routes.js';

// Teacher Management
import teacherRoutes from './routes/teacher.routes.js';

// Admin & Librarian
import adminRoutes from './routes/admin.routes.js';
import librarianRoutes from './routes/librarian.routes.js';

// Academic Structure
import departmentRoutes from './routes/department.routes.js';
import courseRoutes from './routes/course.routes.js';

// Enrollments & Attendance
import enrollmentRoutes from './routes/enrollment.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';

// Grades & Assignments
import gradeRoutes from './routes/grade.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import submissionRoutes from './routes/submission.routes.js';

// Timetable
import timetableRoutes from './routes/timetable.routes.js';

// Fee Management
import feeRoutes from './routes/fee.routes.js';

// Library
import bookRoutes from './routes/book.routes.js';
import borrowRoutes from './routes/borrow.routes.js';

// Club Management
import clubRoutes from './routes/club.routes.js';
import clubMembershipRoutes from './routes/clubMembership.routes.js';
import eventRoutes from './routes/event.routes.js';
import eventParticipationRoutes from './routes/eventParticipation.routes.js';
import clubBudgetRoutes from './routes/clubBudget.routes.js';

// Leave Management
import leaveRoutes from './routes/leave.routes.js';

// Notifications
import notificationRoutes from './routes/notification.routes.js';

// Audit Logs
import auditLogRoutes from './routes/auditLog.routes.js';

// Hostel Management (Optional)
import hostelRoutes from './routes/hostel.routes.js';
import hostelAllocationRoutes from './routes/hostel.routes.js';

// --- Register Routes ---
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);

app.use('/admins', adminRoutes);
app.use('/librarians', librarianRoutes);

app.use('/departments', departmentRoutes);
app.use('/courses', courseRoutes);

app.use('/enrollments', enrollmentRoutes);
app.use('/attendances', attendanceRoutes);

app.use('/grades', gradeRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/', submissionRoutes); // POST /submissions

app.use('/timetables', timetableRoutes);

app.use('/', feeRoutes); // Includes /fee-records, /fee-transactions

app.use('/books', bookRoutes);
app.use('/', borrowRoutes); // POST /borrows, etc.

app.use('/clubs', clubRoutes);
app.use('/', clubMembershipRoutes); // POST /club-memberships
app.use('/events', eventRoutes);
app.use('/', eventParticipationRoutes); // POST /event-participations
app.use('/club-budgets', clubBudgetRoutes);

app.use('/leave-applications', leaveRoutes);

app.use('/notifications', notificationRoutes);

app.use('/audit-logs', auditLogRoutes);

// Hostel (Optional)
app.use('/hostels', hostelRoutes);
app.use('/hostel-allocations', hostelAllocationRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
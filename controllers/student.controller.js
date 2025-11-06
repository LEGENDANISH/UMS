// src/controllers/student.controller.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Utility: check ownership or admin/teacher access
const canAccessStudent = (req, studentUserId) => {
  const user = req.user;
  return (
    user.role === 'ADMIN' ||
    user.role === 'TEACHER' ||
    user.id === studentUserId
  );
};

// --- Helper Functions ---
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-8);
}

// GET /students
const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { email: true, isActive: true } },
        department: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// POST /students
const signup = async (req, res) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    address,
    rollNumber,
    departmentId,
    password, // student provides password
    profileImage,
  } = req.body;

  try {
    // Validate department exists
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept) {
      return res.status(400).json({ error: 'Department not found' });
    }

    // Check for existing roll number
    const existing = await prisma.student.findUnique({
      where: { rollNumber },
    });
    if (existing) {
      return res.status(400).json({ error: 'Roll number already exists' });
    }

    // Generate student email automatically
    const email = `${rollNumber}@school.edu`;

    // Hash student password
    const hashedPassword = await hashPassword(password);

    // Create user account first
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'STUDENT',
        isActive: true,
      },
    });

    // Create student profile
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone,
        address,
        profileImage,
        rollNumber,
        admissionDate: new Date(),
        departmentId,
        currentSemester: 1, // default starting semester
        currentYear: 1, // default starting year
        cgpa: 0,
      },
    });

    res.status(201).json({
      message: 'Signup successful! You can now log in.',
      student,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to signup student' });
  }
}
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET || "supersecretkey",
  { expiresIn: '1d' }
);
  
  res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};
// GET /students/:id
const getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        department: true,
      },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (!canAccessStudent(req, student.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

// PATCH /students/:id
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (!canAccessStudent(req, student.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent updating userId or departmentId unless admin
    if (req.user.role !== 'ADMIN') {
      delete updateData.userId;
      delete updateData.departmentId;
    }

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

// DELETE /students/:id
const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.student.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};


const getMyProfile = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        department: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    res.json(student);
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// --- Relation Endpoints ---
const getEnrollments = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: id },
    include: { course: { include: { department: true, teacher: true } } },
  });
  res.json(enrollments);
};

const getAttendances = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) return res.status(403).json({ error: 'Access denied' });

  const attendances = await prisma.attendance.findMany({
    where: { studentId: id },
    include: { course: true, teacher: true },
  });
  res.json(attendances);
};

const getGrades = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) return res.status(403).json({ error: 'Access denied' });

  const grades = await prisma.grade.findMany({
    where: { studentId: id },
    include: { course: true, teacher: true },
  });
  res.json(grades);
};

const getFeeRecords = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) return res.status(403).json({ error: 'Access denied' });

  const fees = await prisma.feeRecord.findMany({
    where: { studentId: id },
    include: { transactions: true },
  });
  res.json(fees);
};

const getBorrowRecords = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) return res.status(403).json({ error: 'Access denied' });

  const borrows = await prisma.borrowRecord.findMany({
    where: { studentId: id },
    include: { book: true },
  });
  res.json(borrows);
};

const getClubMemberships = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) return res.status(403).json({ error: 'Access denied' });

  const memberships = await prisma.clubMembership.findMany({
    where: { studentId: id },
    include: { club: true },
  });
  res.json(memberships);
};

const getLeaveApplications = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) return res.status(403).json({ error: 'Access denied' });

  const leaves = await prisma.leaveApplication.findMany({
    where: { studentId: id },
  });
  res.json(leaves);
};

const getAssignmentSubmissions = async (req, res) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || !canAccessStudent(req, student.userId)) return res.status(403).json({ error: 'Access denied' });

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: id },
    include: { assignment: { include: { course: true } } },
  });
  res.json(submissions);
};
const getMyEnrollments = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: { course: { include: { department: true, teacher: true } } },
    });

    res.json(enrollments);
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

const getMyAttendances = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { course: true, teacher: true },
    });

    res.json(attendances);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

const getMyGrades = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const grades = await prisma.grade.findMany({
      where: { studentId: student.id },
      include: { course: true, teacher: true },
    });

    res.json(grades);
  } catch (err) {
    console.error('Error fetching grades:', err);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
};

const getMyFeeRecords = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const fees = await prisma.feeRecord.findMany({
      where: { studentId: student.id },
      include: { transactions: true },
    });

    res.json(fees);
  } catch (err) {
    console.error('Error fetching fee records:', err);
    res.status(500).json({ error: 'Failed to fetch fee records' });
  }
};

const getMyBorrowRecords = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const borrows = await prisma.borrowRecord.findMany({
      where: { studentId: student.id },
      include: { book: true },
    });

    res.json(borrows);
  } catch (err) {
    console.error('Error fetching borrow records:', err);
    res.status(500).json({ error: 'Failed to fetch borrow records' });
  }
};

const getMyClubMemberships = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const memberships = await prisma.clubMembership.findMany({
      where: { studentId: student.id },
      include: { club: true },
    });

    res.json(memberships);
  } catch (err) {
    console.error('Error fetching club memberships:', err);
    res.status(500).json({ error: 'Failed to fetch club memberships' });
  }
};

const getMyLeaveApplications = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const leaves = await prisma.leaveApplication.findMany({
      where: { studentId: student.id },
    });

    res.json(leaves);
  } catch (err) {
    console.error('Error fetching leave applications:', err);
    res.status(500).json({ error: 'Failed to fetch leave applications' });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: student.id },
      include: { assignment: { include: { course: true } } },
    });

    res.json(submissions);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};
// --- Export all functions ---
module.exports = {
  getAllStudents,
  signup,
  getStudentById,
  updateStudent,
  deleteStudent,
  getEnrollments,
  getAttendances,
  getGrades,
  getFeeRecords,
  getBorrowRecords,
  getMyProfile,
  getClubMemberships,
  getLeaveApplications,
  getAssignmentSubmissions,
  login,
  getMyProfile,
  getMyEnrollments,
  getMyAttendances,
  getMyGrades,
  getMyFeeRecords,
  getMyBorrowRecords,
  getMyClubMemberships,
  getMyLeaveApplications,
  getMyAssignments,
};

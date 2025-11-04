// src/controllers/student.controller.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

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
const createStudent = async (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    address,
    rollNumber,
    departmentId,
    currentSemester,
    currentYear,
    profileImage,
  } = req.body;

  try {
    // Validate department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) return res.status(400).json({ error: 'Department not found' });

    // If no userId, create a new User first
    let user;
    if (!userId) {
      const email = `${rollNumber}@school.edu`; // or require email in body
      user = await prisma.user.create({
        data: {
          email,
          password: await hashPassword(generateTempPassword()),
          role: 'STUDENT',
          isActive: true,
        },
      });
    } else {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'STUDENT') {
        return res.status(400).json({ error: 'Invalid or non-student user ID' });
      }
    }

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
        currentSemester,
        currentYear,
        cgpa: 0,
      },
    });

    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create student' });
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

// --- Export all functions ---
module.exports = {
  getAllStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getEnrollments,
  getAttendances,
  getGrades,
  getFeeRecords,
  getBorrowRecords,
  getClubMemberships,
  getLeaveApplications,
  getAssignmentSubmissions,
};

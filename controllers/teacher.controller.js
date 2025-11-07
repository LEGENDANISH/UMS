// src/controllers/teacher.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Utility: check if requester can access this teacher
const canAccessTeacher = (req, teacherUserId) => {
  const { role, id } = req.user;
  if (role === 'ADMIN' || role === 'MANAGEMENT') return true;
  if (role === 'TEACHER' && id === teacherUserId) return true;
  return false;
};
// GET /teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { email: true, isActive: true } },
        department: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

// POST /teachers
const createTeacher = async (req, res) => {
  const {
    userId, // optional: link to existing user
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    address,
    profileImage,
    employeeId,
    joiningDate,
    qualification,
    specialization,
    departmentId,
  } = req.body;

  try {
    // Validate department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) return res.status(400).json({ error: 'Department not found' });

    // Validate employeeId uniqueness (Prisma will enforce, but check early)
    const existingEmp = await prisma.teacher.findUnique({ where: { employeeId } });
    if (existingEmp) return res.status(400).json({ error: 'Employee ID already in use' });

    let user;
    if (!userId) {
      const email = `${employeeId}@school.edu`; // or require email
      const hashedPassword = await hashPassword(generateTempPassword());
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'TEACHER',
          isActive: true,
        },
      });
    } else {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'TEACHER') {
        return res.status(400).json({ error: 'Invalid or non-teacher user ID' });
      }
    }

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone,
        address,
        profileImage,
        employeeId,
        joiningDate: new Date(joiningDate),
        qualification,
        specialization,
        departmentId,
      },
    });

    res.status(201).json(teacher);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
};

// GET /teachers/:id
const getTeacherById = async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true, createdAt: true } },
        department: true,
      },
    });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    if (!canAccessTeacher(req, teacher.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
};

// PATCH /teachers/:id
const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    if (!canAccessTeacher(req, teacher.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role !== 'ADMIN') {
      delete updateData.userId;
      delete updateData.departmentId;
      delete updateData.employeeId; // usually immutable
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: updateData,
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }
    res.status(500).json({ error: 'Failed to update teacher' });
  }
};

// DELETE /teachers/:id
const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.teacher.delete({ where: { id } });
    // User is auto-deleted due to onDelete: Cascade
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};

// --- Relation Endpoints ---
const getCourses = async (req, res) => {
  const { id } = req.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher || !canAccessTeacher(req, teacher.userId)) return res.status(403).json({ error: 'Access denied' });

  const courses = await prisma.course.findMany({
    where: { teacherId: id },
    include: { department: true },
  });
  res.json(courses);
};

const getAttendances = async (req, res) => {
  const { id } = req.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher || !canAccessTeacher(req, teacher.userId)) return res.status(403).json({ error: 'Access denied' });

  const attendances = await prisma.attendance.findMany({
    where: { teacherId: id },
    include: { student: true, course: true },
  });
  res.json(attendances);
};

const getGrades = async (req, res) => {
  const { id } = req.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher || !canAccessTeacher(req, teacher.userId)) return res.status(403).json({ error: 'Access denied' });

  const grades = await prisma.grade.findMany({
    where: { teacherId: id },
    include: { student: true, course: true },
  });
  res.json(grades);
};

const getAssignments = async (req, res) => {
  const { id } = req.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher || !canAccessTeacher(req, teacher.userId)) return res.status(403).json({ error: 'Access denied' });

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: id },
    include: { course: true, submissions: true },
  });
  res.json(assignments);
};

const getClubsManaged = async (req, res) => {
  const { id } = req.params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher || !canAccessTeacher(req, teacher.userId)) return res.status(403).json({ error: 'Access denied' });

  const clubs = await prisma.club.findMany({
    where: { coordinatorId: id },
    include: { members: { include: { student: true } }, events: true },
  });
  res.json(clubs);
};

// --- Helpers ---
async function hashPassword(password) {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 12);
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-8);
}

// Export all functions
module.exports = {
  getAllTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getCourses,
  getAttendances,
  getGrades,
  getAssignments,
  getClubsManaged,
};

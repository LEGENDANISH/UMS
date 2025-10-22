// src/controllers/attendance.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllAttendances = async (req, res) => {
  try {
    const attendances = await prisma.attendance.findMany({
      include: {
        student: { select: { firstName: true, lastName: true } },
        course: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendances' });
  }
};

const markAttendance = async (req, res) => {
  const { studentId, courseId, date, status, remarks } = req.body;
  const teacherId = req.user.teacher?.id;

  if (!teacherId) {
    return res.status(400).json({ error: 'Only teachers can mark attendance' });
  }

  try {
    // Validate student & course
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!student) return res.status(400).json({ error: 'Student not found' });
    if (!course) return res.status(400).json({ error: 'Course not found' });

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        courseId,
        teacherId,
        date: new Date(date),
        status,
        remarks,
      },
    });

    res.status(201).json(attendance);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Attendance already marked for this student/course/date' });
    }
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    const updated = await prisma.attendance.update({
      where: { id },
      data: { status, remarks },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

const getByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const attendances = await prisma.attendance.findMany({
      where: { courseId },
      include: { student: true, teacher: true, course: true },
    });
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendances for course' });
  }
};

const getByStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: { course: true, teacher: true },
    });
    res.json(attendances);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendances for student' });
  }
};

module.exports = {
  getAllAttendances,
  markAttendance,
  updateAttendance,
  getByCourse,
  getByStudent,
};

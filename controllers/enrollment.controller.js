// src/controllers/enrollment.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        course: { select: { name: true, code: true } },
      },
    });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

const createEnrollment = async (req, res) => {
  const { studentId, courseId, semester, year } = req.body;

  try {
    // Validate student & course exist
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!student) return res.status(400).json({ error: 'Student not found' });
    if (!course) return res.status(400).json({ error: 'Course not found' });

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        semester,
        year,
      },
    });

    res.status(201).json(enrollment);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Student already enrolled in this course' });
    }
    res.status(500).json({ error: 'Failed to enroll student' });
  }
};

const deleteEnrollment = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.enrollment.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.status(500).json({ error: 'Failed to unenroll' });
  }
};

module.exports = {
  getAllEnrollments,
  createEnrollment,
  deleteEnrollment,
};

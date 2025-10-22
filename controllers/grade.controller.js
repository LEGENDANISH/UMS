// src/controllers/grade.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllGrades = async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        course: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
};

const createGrade = async (req, res) => {
  const {
    studentId,
    courseId,
    examType,
    marksObtained,
    totalMarks,
    grade,
    gpa,
    semester,
    year,
    remarks,
  } = req.body;

  const teacherId = req.user.teacher?.id;
  if (!teacherId) return res.status(403).json({ error: 'Only teachers can create grades' });

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!student) return res.status(400).json({ error: 'Student not found' });
    if (!course) return res.status(400).json({ error: 'Course not found' });

    if (course.teacherId !== teacherId) {
      return res.status(403).json({ error: 'You do not teach this course' });
    }

    const newGrade = await prisma.grade.create({
      data: {
        studentId,
        courseId,
        teacherId,
        examType,
        marksObtained,
        totalMarks,
        grade: grade || null,
        gpa: gpa || null,
        semester,
        year,
        remarks: remarks || null,
      },
    });

    res.status(201).json(newGrade);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create grade' });
  }
};

const updateGrade = async (req, res) => {
  const { id } = req.params;
  const { marksObtained, totalMarks, grade, gpa, remarks } = req.body;

  try {
    const existing = await prisma.grade.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Grade not found' });

    if (existing.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'You can only update your own grades' });
    }

    const updated = await prisma.grade.update({
      where: { id },
      data: {
        marksObtained,
        totalMarks,
        grade: grade || null,
        gpa: gpa || null,
        remarks: remarks || null,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update grade' });
  }
};

const getByStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: { course: true, teacher: true },
    });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades for student' });
  }
};

const getByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const grades = await prisma.grade.findMany({
      where: { courseId },
      include: { student: true, teacher: true },
    });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades for course' });
  }
};

module.exports = {
  getAllGrades,
  createGrade,
  updateGrade,
  getByStudent,
  getByCourse,
};

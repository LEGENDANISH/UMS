// src/controllers/assignment.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllAssignments = async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        course: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

const createAssignment = async (req, res) => {
  const { title, description, courseId, dueDate, totalMarks, attachments = [] } = req.body;
  const teacherId = req.user.teacher?.id;

  if (!teacherId) return res.status(403).json({ error: 'Only teachers can create assignments' });

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(400).json({ error: 'Course not found' });
    if (course.teacherId !== teacherId) {
      return res.status(403).json({ error: 'You do not teach this course' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        courseId,
        teacherId,
        dueDate: new Date(dueDate),
        totalMarks,
        attachments,
      },
    });

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

const getAssignmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { course: true, teacher: true },
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
};

const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, totalMarks, attachments } = req.body;

  try {
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Assignment not found' });
    if (existing.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        totalMarks,
        attachments,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
};

const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (existing?.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.assignment.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Assignment not found' });
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
};

const getSubmissions = async (req, res) => {
  const { id } = req.params;
  try {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: id },
      include: { student: { include: { user: { select: { email: true } } } } },
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

module.exports = {
  getAllAssignments,
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
};

// src/controllers/submission.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSubmission = async (req, res) => {
  const { assignmentId, attachments = [], remarks } = req.body;
  const studentId = req.user.student?.id;

  if (!studentId) {
    return res.status(403).json({ error: 'Only students can submit assignments' });
  }

  try {
    // Validate assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });
    if (!assignment) return res.status(400).json({ error: 'Assignment not found' });

    // Optional: check if due date passed (soft enforcement)
    if (new Date() > new Date(assignment.dueDate)) {
      // You may allow late submissions or reject — here we allow
    }

    const submission = await prisma.assignmentSubmission.create({
      data: { // <-- fixed extra curly braces
        assignmentId,
        studentId,
        attachments,
        remarks,
      },
    });

    res.status(201).json(submission);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'You have already submitted this assignment' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

export const gradeSubmission = async (req, res) => {
  const { id } = req.params;
  const { marksObtained, feedback } = req.body;
  const teacherId = req.user.teacher?.id;

  if (!teacherId) {
    return res.status(403).json({ error: 'Only teachers can grade submissions' });
  }

  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: { assignment: { include: { course: true } } },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    // Ensure teacher owns the assignment's course
    if (submission.assignment.course.teacherId !== teacherId) {
      return res.status(403).json({ error: 'You are not authorized to grade this submission' });
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id },
      data: { // <-- fixed extra curly braces
        marksObtained: marksObtained ?? null,
        feedback: feedback ?? null,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};

export const getByStudent = async (req, res) => {
  const { studentId } = req.params;
  // Optional: restrict to self unless admin/teacher
  const requester = req.user;
  if (
    requester.role !== 'ADMIN' &&
    requester.role !== 'TEACHER' &&
    requester.student?.id !== studentId
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId },
    include: {
      assignment: {
        include: { course: { select: { name: true, code: true } } },
      },
    },
  });
  res.json(submissions);
};

export const getByAssignment = async (req, res) => {
  const { assignmentId } = req.params;
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      student: {
        select: { firstName: true, lastName: true, rollNumber: true },
      },
    },
  });
  res.json(submissions);
};

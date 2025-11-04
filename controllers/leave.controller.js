import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Utility: check if requester can manage this leave
const canManageLeave = (req, studentId) => {
  const user = req.user;
  const isSelf = user.role === 'STUDENT' && user.student?.id === studentId;
  const isStaff = user.role === 'ADMIN' || user.role === 'TEACHER';
  return isSelf || isStaff;
};

export const applyForLeave = async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const studentId = req.user.student?.id;

  if (!studentId) {
    return res.status(403).json({ error: 'Only students can apply for leave' });
  }

  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  try {
    const leave = await prisma.leaveApplication.create({
      data: {  // <-- fixed
        studentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING',
      },
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit leave application' });
  }
};

export const reviewLeave = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  const reviewerId = req.user.id;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
  }

  try {
    const leave = await prisma.leaveApplication.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ error: 'Leave application not found' });

    if (leave.status !== 'PENDING') {
      return res.status(400).json({ error: 'Leave application already reviewed' });
    }

    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: {  // <-- fixed
        status,
        remarks: remarks || null,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to review leave application' });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await prisma.leaveApplication.findMany({
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave applications' });
  }
};

export const getByStudent = async (req, res) => {
  const { studentId } = req.params;
  if (!canManageLeave(req, studentId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const leaves = await prisma.leaveApplication.findMany({
    where: { studentId },
    orderBy: { appliedAt: 'desc' },
  });
  res.json(leaves);
};

export const getPendingLeaves = async (req, res) => {
  const leaves = await prisma.leaveApplication.findMany({
    where: { status: 'PENDING' },
    include: {
      student: { select: { firstName: true, lastName: true, rollNumber: true } },
    },
    orderBy: { appliedAt: 'asc' },
  });
  res.json(leaves);
};

export const deleteLeave = async (req, res) => {
  const { id } = req.params;
  try {
    const leave = await prisma.leaveApplication.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ error: 'Leave application not found' });

    if (!canManageLeave(req, leave.studentId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cannot delete a reviewed leave application' });
    }

    await prisma.leaveApplication.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leave application' });
  }
};

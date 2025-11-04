// src/controllers/clubMembership.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Utility: check if requester can manage this membership
const canManageMembership = (req, studentId, clubId) => {
  const user = req.user;
  const isSelf = user.role === 'STUDENT' && user.student?.id === studentId;
  const isAdmin = user.role === 'ADMIN';
  const isCoordinator = user.role === 'TEACHER' || user.role === 'CLUB_COORDINATOR';

  if (isSelf) return true;
  if (isAdmin) return true;
  if (isCoordinator) {
    // Check if user is coordinator of this club
    return prisma.club.findFirst({
      where: { id: clubId, coordinatorId: user.teacher?.id || user.id },
    }).then(club => !!club);
  }
  return false;
};

export const joinClub = async (req, res) => {
  const { clubId } = req.body;
  const studentId = req.user.student?.id;

  if (!studentId) {
    return res.status(403).json({ error: 'Only students can join clubs' });
  }

  try {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(400).json({ error: 'Club not found' });

    const membership = await prisma.clubMembership.create({
      data: { // <-- fixed
        studentId,
        clubId,
        role: 'MEMBER',
        status: 'PENDING', // or 'ACTIVE' if auto-approve
      },
    });
    res.status(201).json(membership);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'You are already a member of this club' });
    }
    res.status(500).json({ error: 'Failed to join club' });
  }
};

export const updateMembership = async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const membership = await prisma.clubMembership.findUnique({
      where: { id },
      include: { club: true },
    });
    if (!membership) return res.status(404).json({ error: 'Membership not found' });

    const canManage = await canManageMembership(req, membership.studentId, membership.clubId);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.clubMembership.update({
      where: { id },
      data: { // <-- fixed
        role,
        status,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update membership' });
  }
};

export const leaveClub = async (req, res) => {
  const { id } = req.params;

  try {
    const membership = await prisma.clubMembership.findUnique({ where: { id } });
    if (!membership) return res.status(404).json({ error: 'Membership not found' });

    const canManage = await canManageMembership(req, membership.studentId, membership.clubId);
    if (!canManage) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.clubMembership.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave club' });
  }
};

export const getStudentClubs = async (req, res) => {
  const { studentId } = req.params;
  const user = req.user;

  // Allow self, admin, or club coordinator
  if (
    user.role !== 'ADMIN' &&
    user.role !== 'TEACHER' &&
    user.role !== 'CLUB_COORDINATOR' &&
    user.student?.id !== studentId
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const memberships = await prisma.clubMembership.findMany({
    where: { studentId },
    include: { club: true },
  });
  res.json(memberships);
};

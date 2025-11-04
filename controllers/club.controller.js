// src/controllers/club.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllClubs = async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        coordinator: { select: { firstName: true, lastName: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
};

export const createClub = async (req, res) => {
  const { name, description, category, establishedDate, logo, coordinatorId } = req.body;

  try {
    // Optional: validate coordinator exists if provided
    if (coordinatorId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: coordinatorId } });
      if (!teacher) return res.status(400).json({ error: 'Coordinator must be a valid teacher' });
    }

    const club = await prisma.club.create({
      data: { // <-- fixed
        name,
        description: description || null,
        category,
        establishedDate: new Date(establishedDate),
        logo: logo || null,
        coordinatorId: coordinatorId || null,
      },
    });
    res.status(201).json(club);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Club name already exists' });
    }
    res.status(500).json({ error: 'Failed to create club' });
  }
};

export const getClubById = async (req, res) => {
  const { id } = req.params;
  try {
    const club = await prisma.club.findUnique({
      where: { id },
      include: { coordinator: true },
    });
    if (!club) return res.status(404).json({ error: 'Club not found' });
    res.json(club);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch club' });
  }
};

export const updateClub = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, establishedDate, logo, coordinatorId } = req.body;

  try {
    if (coordinatorId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: coordinatorId } });
      if (!teacher) return res.status(400).json({ error: 'Coordinator must be a valid teacher' });
    }

    const updated = await prisma.club.update({
      where: { id },
      data: { // <-- fixed
        name,
        description: description || null,
        category,
        establishedDate: establishedDate ? new Date(establishedDate) : undefined,
        logo: logo || null,
        coordinatorId: coordinatorId || null,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Club name already in use' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Club not found' });
    }
    res.status(500).json({ error: 'Failed to update club' });
  }
};

export const deleteClub = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.club.delete({ where: { id } });
    // Cascades to: events, budgets, memberships (via relations)
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Club not found' });
    }
    res.status(500).json({ error: 'Failed to delete club' });
  }
};

// --- Relation Endpoints ---

export const getMembers = async (req, res) => {
  const { id } = req.params;
  const members = await prisma.clubMembership.findMany({
    where: { clubId: id },
    include: {
      student: {
        include: { user: { select: { email: true } } },
      },
    },
  });
  res.json(members);
};

export const getEvents = async (req, res) => {
  const { id } = req.params;
  const events = await prisma.event.findMany({
    where: { clubId: id },
    include: { participations: true },
  });
  res.json(events);
};

export const getBudgets = async (req, res) => {
  const { id } = req.params;
  const budgets = await prisma.clubBudget.findMany({
    where: { clubId: id },
  });
  res.json(budgets);
};

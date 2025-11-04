// src/controllers/timetable.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllTimetables = async (req, res) => {
  try {
    const timetables = await prisma.timetable.findMany({
      include: { course: { include: { department: true, teacher: true } } },
      orderBy: { dayOfWeek: 'asc' },
    });
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetables' });
  }
};

export const createTimetable = async (req, res) => {
  const { courseId, dayOfWeek, startTime, endTime, roomNumber } = req.body;

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(400).json({ error: 'Course not found' });

    const timetable = await prisma.timetable.create({
      data: {  // <-- fixed
        courseId,
        dayOfWeek,
        startTime,
        endTime,
        roomNumber: roomNumber || null,
      },
    });
    res.status(201).json(timetable);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
};

export const getTimetableById = async (req, res) => {
  const { id } = req.params;
  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!timetable) return res.status(404).json({ error: 'Timetable entry not found' });
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable entry' });
  }
};

export const updateTimetable = async (req, res) => {
  const { id } = req.params;
  const { courseId, dayOfWeek, startTime, endTime, roomNumber } = req.body;

  try {
    const existing = await prisma.timetable.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    const updated = await prisma.timetable.update({
      where: { id },
      data: {  // <-- fixed
        courseId,
        dayOfWeek,
        startTime,
        endTime,
        roomNumber: roomNumber || null,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
};

export const deleteTimetable = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.timetable.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
};

export const getByCourse = async (req, res) => {
  const { courseId } = req.params;
  const timetables = await prisma.timetable.findMany({
    where: { courseId },
    include: { course: true },
  });
  res.json(timetables);
};

export const getByDay = async (req, res) => {
  const { dayOfWeek } = req.params;
  const timetables = await prisma.timetable.findMany({
    where: { dayOfWeek: parseInt(dayOfWeek) },
    include: { course: { include: { teacher: true, department: true } } },
  });
  res.json(timetables);
};

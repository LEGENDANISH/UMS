import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registerForEvent = async (req, res) => {
  const { eventId } = req.body;
  const studentId = req.user.student?.id;

  if (!studentId) {
    return res.status(403).json({ error: 'Only students can register for events' });
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(400).json({ error: 'Event not found' });

    // Optional: check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    // Optional: check maxParticipants
    if (event.maxParticipants) {
      const count = await prisma.eventParticipation.count({ where: { eventId } });
      if (count >= event.maxParticipants) {
        return res.status(400).json({ error: 'Event is at full capacity' });
      }
    }

    const participation = await prisma.eventParticipation.create({
      data: {  // <-- fixed
        eventId,
        studentId,
        attended: false,
      },
    });

    res.status(201).json(participation);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }
    res.status(500).json({ error: 'Failed to register for event' });
  }
};

export const markAsAttended = async (req, res) => {
  const { id } = req.params;

  try {
    const participation = await prisma.eventParticipation.findUnique({ where: { id } });
    if (!participation) return res.status(404).json({ error: 'Participation record not found' });

    const updated = await prisma.eventParticipation.update({
      where: { id },
      data: { attended: true }, // <-- fixed
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

export const getByEvent = async (req, res) => {
  const { eventId } = req.params;
  const participations = await prisma.eventParticipation.findMany({
    where: { eventId },
    include: {
      event: { select: { title: true, eventDate: true } },
      student: { select: { firstName: true, lastName: true, rollNumber: true } },
    },
  });
  res.json(participations);
};

export const getByStudent = async (req, res) => {
  const { studentId } = req.params;
  const user = req.user;

  // Allow self, admin, teacher, or club coordinator
  if (
    user.role !== 'ADMIN' &&
    user.role !== 'TEACHER' &&
    user.role !== 'CLUB_COORDINATOR' &&
    user.student?.id !== studentId
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const participations = await prisma.eventParticipation.findMany({
    where: { studentId },
    include: {
      event: { select: { title: true, eventDate: true, venue: true } },
    },
  });
  res.json(participations);
};

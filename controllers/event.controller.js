import prisma from '../prisma/client.js';

// GET /events
export const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { eventDate: 'desc' },
        include: { club: { select: { id: true, name: true } } },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      data: events,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// GET /events/:id
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true } },
        participations: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// POST /events
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      clubId,
      eventDate,
      startTime,
      endTime,
      venue,
      maxParticipants,
      registrationDeadline,
      status = 'UPCOMING',
      banner,
    } = req.body;

    // Validate clubId if provided
    if (clubId) {
      const club = await prisma.club.findUnique({ where: { id: clubId } });
      if (!club) return res.status(400).json({ error: 'Invalid clubId: club not found' });
    }

    if (registrationDeadline && new Date(registrationDeadline) >= new Date(eventDate)) {
      return res.status(400).json({
        error: 'Registration deadline must be before the event date',
      });
    }

    const event = await prisma.event.create({
      data: { // <-- fixed
        title,
        description: description || null,
        clubId: clubId || null,
        eventDate,
        startTime,
        endTime,
        venue: venue || null,
        maxParticipants: maxParticipants || null,
        registrationDeadline: registrationDeadline || null,
        status,
        banner: banner || null,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// PATCH /events/:id
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // Validate clubId if provided
    if (data.clubId !== undefined && data.clubId !== null) {
      const club = await prisma.club.findUnique({ where: { id: data.clubId } });
      if (!club) return res.status(400).json({ error: 'Invalid clubId' });
    }

    // Handle optional nulls
    data.description = data.description === undefined ? undefined : data.description || null;
    data.venue = data.venue === undefined ? undefined : data.venue || null;
    data.banner = data.banner === undefined ? undefined : data.banner || null;
    if (data.maxParticipants === undefined) delete data.maxParticipants;
    if (data.registrationDeadline === undefined) delete data.registrationDeadline;

    const event = await prisma.event.update({
      where: { id },
      data, // <-- fixed
    });

    res.json(event);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Event not found' });
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// DELETE /events/:id
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const participationCount = await prisma.eventParticipation.count({
      where: { eventId: id },
    });

    if (participationCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete event with registered participants',
      });
    }

    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Event not found' });
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// GET /events/by-club/:clubId
export const getEventsByClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(404).json({ error: 'Club not found' });

    const events = await prisma.event.findMany({
      where: { clubId },
      orderBy: { eventDate: 'desc' },
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events by club' });
  }
};

// GET /events/upcoming
export const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await prisma.event.findMany({
      where: { status: 'UPCOMING', eventDate: { gte: now } },
      orderBy: { eventDate: 'asc' },
      include: { club: { select: { name: true } } },
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
};

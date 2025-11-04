import prisma from '../prisma/client.js';

// ✅ GET /hostels
export const getHostels = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = type ? { type } : {};

    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
        include: {
          rooms: {
            select: {
              id: true,
              roomNumber: true,
              capacity: true,
              occupied: true,
              feePerSemester: true,
            },
          },
        },
      }),
      prisma.hostel.count({ where }),
    ]);

    res.json({
      hostels,
      meta: { total, page: Number(page), lastPage: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch hostels' });
  }
};

// ✅ GET /hostels/:id
export const getHostelById = async (req, res) => {
  try {
    const { id } = req.params;
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            capacity: true,
            occupied: true,
            feePerSemester: true,
          },
        },
      },
    });
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    res.json(hostel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch hostel' });
  }
};

// ✅ GET /hostels/:id/rooms
export const getHostelRooms = async (req, res) => {
  try {
    const { id } = req.params;

    const hostel = await prisma.hostel.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const rooms = await prisma.hostelRoom.findMany({
      where: { hostelId: id },
      select: {
        id: true,
        roomNumber: true,
        capacity: true,
        occupied: true,
        feePerSemester: true,
      },
      orderBy: { roomNumber: 'asc' },
    });

    res.json({ hostel, totalRooms: rooms.length, rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch hostel rooms' });
  }
};

// ✅ POST /hostels
export const createHostel = async (req, res) => {
  try {
    const { name, type, totalRooms, warden } = req.body;

    const existing = await prisma.hostel.findUnique({ where: { name } });
    if (existing)
      return res
        .status(409)
        .json({ error: 'Hostel with this name already exists' });

    const hostel = await prisma.hostel.create({
      data: { name, type, totalRooms, warden: warden || null },
    });

    res.status(201).json(hostel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create hostel' });
  }
};

// ✅ POST /hostel-allocations
export const allocateHostelRoom = async (req, res) => {
  try {
    const { roomId, studentId } = req.body;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(400).json({ error: 'Invalid studentId' });

    const room = await prisma.hostelRoom.findUnique({ where: { id: roomId } });
    if (!room) return res.status(400).json({ error: 'Invalid roomId' });

    if (room.occupied >= room.capacity) {
      return res.status(400).json({ error: 'Room is at full capacity' });
    }

    const existingAllocation = await prisma.hostelAllocation.findFirst({
      where: { studentId, vacatedDate: null },
    });
    if (existingAllocation) {
      return res.status(400).json({ error: 'Student already has an active hostel allocation' });
    }

    const allocation = await prisma.hostelAllocation.create({
      data: { roomId, studentId },
    });

    await prisma.hostelRoom.update({
      where: { id: roomId },
      data: { occupied: { increment: 1 } },
    });

    res.status(201).json(allocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to allocate hostel room' });
  }
};

// ✅ PATCH /hostel-allocations/:id
export const vacateHostelRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.hostelAllocation.findUnique({ where: { id } });
    if (!allocation || allocation.vacatedDate) {
      return res.status(400).json({ error: 'Allocation not found or already vacated' });
    }

    const updated = await prisma.hostelAllocation.update({
      where: { id },
      data: { vacatedDate: new Date() },
    });

    await prisma.hostelRoom.update({
      where: { id: allocation.roomId },
      data: { occupied: { decrement: 1 } },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to vacate room' });
  }
};

// ✅ GET /hostel-allocations/by-student/:studentId
export const getAllocationsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const allocations = await prisma.hostelAllocation.findMany({
      where: { studentId },
      include: {
        room: {
          include: {
            hostel: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { allocatedDate: 'desc' },
    });

    res.json({ studentId, total: allocations.length, allocations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch allocations for student' });
  }
};

// src/controllers/user.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } },
        teacher: { select: { firstName: true, lastName: true, employeeId: true } },
        admin: { select: { firstName: true, lastName: true } },
        librarian: { select: { firstName: true, lastName: true, employeeId: true } },
      },
    });

    const total = await prisma.user.count({ where });

    res.json({
      data: users.map(sanitizeUser),
      meta: { total, page: parseInt(page), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        admin: true,
        librarian: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, student, teacher, admin, librarian } = req.body;

    // Update User
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update profile if provided
    if (student) {
      await prisma.student.update({ where: { userId: id }, data: student });
    }
    if (teacher) {
      await prisma.teacher.update({ where: { userId: id }, data: teacher });
    }
    if (admin) {
      await prisma.admin.update({ where: { userId: id }, data: admin });
    }
    if (librarian) {
      await prisma.librarian.update({ where: { userId: id }, data: librarian });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        admin: true,
        librarian: true,
      },
    });

    res.json({ user: sanitizeUser(fullUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete recommended
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
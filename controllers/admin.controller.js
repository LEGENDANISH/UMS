// src/controllers/admin.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true,
            lastLogin: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

export const getAdminById = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = await prisma.admin.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true,
            lastLogin: true,
          },
        },
      },
    });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, designation, permissions } = req.body;

  try {
    const updated = await prisma.admin.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        designation,
        permissions, // Prisma stores String[] as JSON array in PostgreSQL
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.status(500).json({ error: 'Failed to update admin' });
  }
};
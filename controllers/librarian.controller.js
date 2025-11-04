// src/controllers/librarian.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllLibrarians = async (req, res) => {
  try {
    const librarians = await prisma.librarian.findMany({
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
    res.json(librarians);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch librarians' });
  }
};

export const getLibrarianById = async (req, res) => {
  const { id } = req.params;
  try {
    const librarian = await prisma.librarian.findUnique({
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
    if (!librarian) return res.status(404).json({ error: 'Librarian not found' });
    res.json(librarian);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch librarian' });
  }
};

export const updateLibrarian = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, employeeId } = req.body;

  try {
    // Check employeeId uniqueness if provided
    if (employeeId) {
      const existing = await prisma.librarian.findUnique({ where: { employeeId } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'Employee ID already in use' });
      }
    }

    const updated = await prisma.librarian.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        employeeId,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Librarian not found' });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }
    res.status(500).json({ error: 'Failed to update librarian' });
  }
};
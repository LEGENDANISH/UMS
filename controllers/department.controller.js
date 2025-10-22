// src/controllers/department.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        // Optionally include head teacher
        // head: { select: { firstName: true, lastName: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

exports.createDepartment = async (req, res) => {
  const { name, code, description, headId } = req.body;

  try {
    // If headId is provided, validate it exists and is a teacher
    if (headId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: headId } });
      if (!teacher) {
        return res.status(400).json({ error: 'Head must be a valid teacher' });
      }
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description,
        headId: headId || null,
      },
    });

    res.status(201).json(department);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Department name or code already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
};

exports.getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: { 
          select: { 
            firstName: true, 
            lastName: true, 
            employeeId: true 
          } 
        },
      },
    });
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, headId } = req.body;

  try {
    if (headId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: headId } });
      if (!teacher) {
        return res.status(400).json({ error: 'Head must be a valid teacher' });
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name,
        code,
        description,
        headId: headId || null,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Name or code already in use' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.status(500).json({ error: 'Failed to update department' });
  }
};

exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    // ⚠️ Warning: This will cascade-delete:
    // - All students in this department
    // - All teachers in this department
    // - All courses in this department
    // Consider soft-delete or blocking if department is in use
    await prisma.department.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

// src/controllers/auth.controller.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Helper: hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Helper: exclude password
const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const register = async (req, res) => {
  const { email, password, role, profile } = req.body;

  try {
    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await hashPassword(password);

    // Start transaction
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        isActive: true,
      },
    });

    let profileRecord = null;

    switch (role) {
      case 'STUDENT':
        profileRecord = await prisma.student.create({
           data: {
    user: { connect: { id: user.id } },
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: new Date(profile.dateOfBirth),
    gender: profile.gender,
    phone: profile.phone,
    rollNumber: profile.rollNumber,
    admissionDate: new Date(),
    currentSemester: profile.currentSemester,
    currentYear: profile.currentYear,
    cgpa: 0,
    // departmentId: optional now
  },
        });
        break;

      case 'TEACHER':
        profileRecord = await prisma.teacher.create({
          data: {
            userId: user.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            dateOfBirth: new Date(profile.dateOfBirth),
            gender: profile.gender,
            phone: profile.phone,
            employeeId: profile.employeeId,
            joiningDate: new Date(profile.joiningDate),
            qualification: profile.qualification,
            specialization: profile.specialization || null,
            departmentId: profile.departmentId,
          },
        });
        break;

      case 'ADMIN':
        profileRecord = await prisma.admin.create({
          data: {
            userId: user.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            designation: profile.designation,
            permissions: profile.permissions || [],
          },
        });
        break;

      case 'LIBRARIAN':
        profileRecord = await prisma.librarian.create({
          data: {
            userId: user.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            employeeId: profile.employeeId,
          },
        });
        break;

      default:
        await prisma.user.delete({ where: { id: user.id } });
        return res.status(400).json({ error: 'Invalid role' });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        details: JSON.stringify({ role }),
        ipAddress: req.ip,
      },
    });

    res.status(201).json({ user: sanitizeUser({ ...user, [role.toLowerCase()]: profileRecord }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true,
        admin: true,
        librarian: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = (req, res) => {
  // With JWT, logout is client-side (discard token)
  // Optional: add token to blacklist if using Redis
  res.status(204).send();
};

export const getMe = (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id: userId } = req.user;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
};
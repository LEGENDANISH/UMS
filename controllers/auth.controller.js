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
  try {
    // ✅ Step 1: Handle multipart/form-data JSON parsing
    if (req.body.profile && typeof req.body.profile === "string") {
      try {
        req.body.profile = JSON.parse(req.body.profile);
      } catch (err) {
        return res.status(400).json({ error: "Invalid JSON in profile field" });
      }
    }

    const { email, password, role, profile = req.body } = req.body;

    // ✅ Step 2: Validate required fields
    if (!email || !password || !role || !profile?.firstName) {
      return res
        .status(400)
        .json({ error: "Missing required registration fields" });
    }

    // ✅ Step 3: Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await hashPassword(password);

    // ✅ Step 4: Create user record
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        isActive: true,
      },
    });

    let profileRecord = null;

    // ✅ Step 5: Role-based profile creation
    switch (role) {
      case "STUDENT":
        profileRecord = await prisma.student.create({
          data: {
            user: { connect: { id: user.id } },
            firstName: profile.firstName,
            lastName: profile.lastName,
            dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
            gender: profile.gender,
            phone: profile.phone,
            rollNumber: profile.rollNumber,
            admissionDate: new Date(),
            currentSemester: profile.currentSemester,
            currentYear: profile.currentYear,
            cgpa: 0,
          },
        });
        break;

     case "TEACHER":
  profileRecord = await prisma.teacher.create({
    data: {
      user: { connect: { id: user.id } }, // ✅ Fix: relation connect instead of userId
      firstName: profile.firstName,
      lastName: profile.lastName,
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date(), // ✅ safe fallback
      gender: profile.gender || "OTHER",
      phone: profile.phone || "N/A", // Prisma expects string, not null
      employeeId: profile.employeeId,
      joiningDate: profile.joiningDate ? new Date(profile.joiningDate) : new Date(),
      qualification: profile.qualification || "Not specified",
      specialization: profile.specialization || null,
      // ✅ Department is required in schema, use a default one if not provided
      

    },
  });
  break;

      case "ADMIN":
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

      case "LIBRARIAN":
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
        return res.status(400).json({ error: "Invalid role" });
    }

    // ✅ Step 6: Log audit entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ role }),
        ipAddress: req.ip,
      },
    });

    // ✅ Step 7: Send clean response
    res
      .status(201)
      .json({ user: sanitizeUser({ ...user, [role.toLowerCase()]: profileRecord }) });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
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

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials: user not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is inactive. Contact admin." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials: wrong password" });
    }

    // ✅ Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // ✅ Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        ipAddress: req.ip,
      },
    });

    // ✅ Sign JWT token with role
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Clean response
    res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("❌ Login failed:", err);
    res.status(500).json({ error: "Server error during login" });
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
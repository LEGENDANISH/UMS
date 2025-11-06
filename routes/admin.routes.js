// src/routes/admin.routes.js
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import * as adminCtrl from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // fallback for dev

// ✅ 1. Admin Login Route (with special case)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅  Special built-in Admin (Anish)
    if ((email === "anish@ums.com" || email === "anish") && password === "12345678") {
      let adminUser = await prisma.user.findFirst({
        where: { email: "anish@ums.com" },
      });

      // Create the admin if not found
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: "anish@ums.com",
            password: bcrypt.hashSync("12345678", 10),
            role: "ADMIN",
            isActive: true,
          },
        });
        console.log("✅ Created special admin user: Anish");
      }

      const token = jwt.sign(
        { userId: adminUser.id, role: adminUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Special admin login successful",
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
    }

    // ✅ Validate inputs for normal login
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    // ✅ Normal admin login
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
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // ✅ Check role
    if (user.role !== "ADMIN" && user.role !== "MANAGEMENT") {
      return res.status(403).json({ error: "Access denied: not an admin" });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Server error during admin login" });
  }
});

// ✅ 2. Protected Admin Management Routes
router.get(
  "/",
  authenticate,
  authorizeRoles(["ADMIN", "MANAGEMENT"]),
  adminCtrl.getAllAdmins
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles(["ADMIN", "MANAGEMENT"]),
  adminCtrl.getAdminById
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles(["ADMIN", "MANAGEMENT"]),
  adminCtrl.updateAdmin
);

export default router;

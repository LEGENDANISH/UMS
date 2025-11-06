// src/routes/auth.routes.js
import { Router } from "express";
import multer from "multer";
import * as authCtrl from "../controllers/auth.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js"; // ✅ Correct import

const router = Router();

// ✅ Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Public routes
router.post("/register", upload.single("profileImage"), authCtrl.register);
router.post("/login", authCtrl.login);
router.post("/logout", authCtrl.logout);

// ✅ Protected routes
router.get("/me", authenticate, authCtrl.getMe);
router.patch("/change-password", authenticate, authCtrl.changePassword);

// ✅ Role-based (optional example)
router.get("/admin-dashboard", authenticate, authorizeRoles(["ADMIN"]), (req, res) => {
  res.json({ message: `Welcome, ${req.user.role}` });
});

export default router;

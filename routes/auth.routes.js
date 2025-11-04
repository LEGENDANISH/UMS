// src/routes/auth.routes.js
import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import multer from "multer";

const router = Router();

// ✅ Setup Multer (for handling file uploads)
const storage = multer.memoryStorage(); // keeps file in memory (you can store to disk if needed)
const upload = multer({ storage });

// ✅ Register route handles both JSON and multipart/form-data
router.post("/register", upload.single("profileImage"), authCtrl.register);

router.post("/login", authCtrl.login);
router.post("/logout", authCtrl.logout);
router.get("/me", authCtrl.getMe);
router.patch("/change-password", authCtrl.changePassword);

export default router;

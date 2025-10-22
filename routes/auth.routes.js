// src/routes/auth.routes.js
import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/logout', authCtrl.logout);
router.get('/me', authCtrl.getMe);
router.patch('/change-password', authCtrl.changePassword);

export default router;
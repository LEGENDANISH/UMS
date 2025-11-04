// src/routes/user.routes.js
import { Router } from 'express';
import * as userCtrl from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Admin-only routes
router.get('/', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), userCtrl.getAllUsers);
router.get('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), userCtrl.getUserById);
router.patch('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), userCtrl.updateUser);
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), userCtrl.deleteUser);

export default router;
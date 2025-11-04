// src/routes/admin.routes.js
import { Router } from 'express';
import * as adminCtrl from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), adminCtrl.getAllAdmins);
router.get('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), adminCtrl.getAdminById);
router.patch('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), adminCtrl.updateAdmin);

export default router;
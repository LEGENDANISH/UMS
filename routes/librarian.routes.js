// src/routes/librarian.routes.js
import { Router } from 'express';
import * as librarianCtrl from '../controllers/librarian.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), librarianCtrl.getAllLibrarians);
router.get('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), librarianCtrl.getLibrarianById);
router.patch('/:id', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), librarianCtrl.updateLibrarian);

export default router;
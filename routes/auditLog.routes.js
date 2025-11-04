// src/routes/auditLog.routes.js
import { Router } from 'express';
import * as auditCtrl from '../controllers/auditLog.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  userIdParamSchema,
  actionParamSchema,
} from '../validation/auditLog.validation.js';

const router = Router();

// Admin-only access
router.get(
  '/audit-logs',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  auditCtrl.getAllAuditLogs
);

router.get(
  '/audit-logs/by-user/:userId',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  validate(userIdParamSchema),
  auditCtrl.getByUser
);

router.get(
  '/audit-logs/by-action/:action',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  validate(actionParamSchema),
  auditCtrl.getByAction
);

export default router;
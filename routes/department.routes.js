// src/routes/department.routes.js
import { Router } from 'express';
import * as deptCtrl from '../controllers/department.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdSchema,
} from '../validation/department.validation.js';

const router = Router();

router.get(
  '/',
  authenticate,
  deptCtrl.getAllDepartments
);

router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  validate(createDepartmentSchema),
  deptCtrl.createDepartment
);

router.get(
  '/:id',
  authenticate,
  validate(departmentIdSchema),
  deptCtrl.getDepartmentById
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  validate(updateDepartmentSchema),
  deptCtrl.updateDepartment
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(departmentIdSchema),
  deptCtrl.deleteDepartment
);

export default router;
// src/routes/fee.routes.js
import { Router } from 'express';
import * as feeCtrl from '../controllers/fee.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createFeeRecordSchema,
  updateFeeRecordSchema,
  feeRecordIdSchema,
  createFeeTransactionSchema,
  feeRecordIdParamSchema,
} from '../validation/fee.validation.js';

const router = Router();

// Fee Records
router.get('/', authenticate, authorizeRoles('ADMIN', 'MANAGEMENT'), feeCtrl.getAllFeeRecords);
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  validate(createFeeRecordSchema),
  feeCtrl.createFeeRecord
);
router.get('/:id', authenticate, validate(feeRecordIdSchema), feeCtrl.getFeeRecordById);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  validate(updateFeeRecordSchema),
  feeCtrl.updateFeeRecord
);

// Student-specific
router.get('/students/:studentId/fee-records', authenticate, feeCtrl.getFeeRecordsByStudent);

// Transactions
router.post(
  '/fee-transactions',
  authenticate,
  authorizeRoles('ADMIN', 'MANAGEMENT'),
  validate(createFeeTransactionSchema),
  feeCtrl.createFeeTransaction
);
router.get(
  '/fee-transactions/by-record/:feeRecordId',
  authenticate,
  validate(feeRecordIdParamSchema),
  feeCtrl.getTransactionsByRecord
);

export default router;
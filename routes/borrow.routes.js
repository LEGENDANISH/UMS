// src/routes/borrow.routes.js
import { Router } from 'express';
import * as borrowCtrl from '../controllers/borrow.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createBorrowSchema,
  returnBorrowSchema,
  borrowIdSchema,
  studentIdParamSchema,
  bookIdParamSchema,
} from '../validation/borrow.validation.js';

const router = Router();

// Librarian/Admin: issue book
router.post(
  '/borrows',
  authenticate,
  authorizeRoles('LIBRARIAN', 'ADMIN'),
  validate(createBorrowSchema),
  borrowCtrl.issueBook
);

// Librarian/Admin: return book
router.patch(
  '/borrows/:id',
  authenticate,
  authorizeRoles('LIBRARIAN', 'ADMIN'),
  validate(returnBorrowSchema),
  borrowCtrl.returnBook
);

// Read routes
router.get('/borrows', authenticate, borrowCtrl.getAllBorrows);
router.get(
  '/borrows/by-student/:studentId',
  authenticate,
  validate(studentIdParamSchema),
  borrowCtrl.getByStudent
);
router.get(
  '/borrows/by-book/:bookId',
  authenticate,
  validate(bookIdParamSchema),
  borrowCtrl.getByBook
);

export default router;
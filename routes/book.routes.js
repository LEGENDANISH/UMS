// src/routes/book.routes.js
import { Router } from 'express';
import * as bookCtrl from '../controllers/book.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createBookSchema,
  updateBookSchema,
  bookIdSchema,
  searchBooksQuerySchema,
} from '../validation/book.validation.js';

const router = Router();

// Public (authenticated) or librarian access
router.get('/', authenticate, bookCtrl.getAllBooks);
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN', 'LIBRARIAN'),
  validate(createBookSchema),
  bookCtrl.createBook
);
router.get('/:id', authenticate, validate(bookIdSchema), bookCtrl.getBookById);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'LIBRARIAN'),
  validate(updateBookSchema),
  bookCtrl.updateBook
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(bookIdSchema),
  bookCtrl.deleteBook
);

// Search
router.get(
  '/search',
  authenticate,
  validate(searchBooksQuerySchema),
  bookCtrl.searchBooks
);

export default router;
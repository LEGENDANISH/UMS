// src/validation/borrow.validation.js
import { z } from 'zod';

export const borrowIdSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Borrow record ID is required') }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ studentId: z.string().min(1) }),
});

export const bookIdParamSchema = z.object({
  params: z.object({ bookId: z.string().min(1) }),
});

export const createBorrowSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    bookId: z.string().min(1),
    dueDate: z.string().datetime(),
  }),
});

export const returnBorrowSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  // No body required — return is action-based
});
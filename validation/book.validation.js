// src/validation/book.validation.js
import { z } from 'zod';

const bookStatusEnum = z.enum(['AVAILABLE', 'ISSUED', 'RESERVED', 'MAINTENANCE']);

export const bookIdSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Book ID is required') }),
});

export const createBookSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    isbn: z.string().min(10).max(17), // ISBN-10 or ISBN-13
    publisher: z.string().optional(),
    publishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
    category: z.string().min(1),
    description: z.string().optional(),
    totalCopies: z.number().int().min(1),
    shelfLocation: z.string().optional(),
    coverImage: z.string().url().optional(),
  }),
});

export const updateBookSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    isbn: z.string().min(10).max(17).optional(),
    publisher: z.string().optional(),
    publishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
    category: z.string().min(1).optional(),
    description: z.string().optional(),
    totalCopies: z.number().int().min(1).optional(),
    availableCopies: z.number().int().min(0).optional(),
    status: bookStatusEnum.optional(),
    shelfLocation: z.string().optional(),
    coverImage: z.string().url().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const searchBooksQuerySchema = z.object({
  query: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    category: z.string().optional(),
  }).optional(),
});
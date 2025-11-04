// src/validation/club.validation.js
import { z } from 'zod';

export const clubIdSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Club ID is required') }),
});

export const createClubSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Club name is required'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    establishedDate: z.string().datetime(),
    logo: z.string().url().optional(),
    coordinatorId: z.string().optional(),
  }),
});

export const updateClubSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().min(1).optional(),
    establishedDate: z.string().datetime().optional(),
    logo: z.string().url().optional(),
    coordinatorId: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
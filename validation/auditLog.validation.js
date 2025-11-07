import { z } from 'zod';

export const userIdParamSchema = z.object({
  params: z.object({ userId: z.string().min(1, 'User ID is required') }),
});

export const actionParamSchema = z.object({
  params: z.object({
    action: z.string().min(1, 'Action is required').regex(/^[A-Z_]+$/, 'Action should be uppercase with underscores (e.g., LOGIN, UPDATE)'),
  }),
});
import { z } from 'zod';

const baseBudgetSchema = z.object({
  clubId: z.string().min(1),
  title: z.string().min(2).max(100),
  description: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().optional(),
});

export const createClubBudgetSchema = baseBudgetSchema;

export const getBudgetsByClubSchema = z.object({
  clubId: z.string().min(1),
});

export const getBudgetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  clubId: z.string().optional(),
});
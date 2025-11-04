// src/validation/department.validation.js
import { z } from 'zod';

export const departmentIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Department ID is required'),
  }),
});

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    code: z.string()
      .min(1, 'Department code is required')
      .regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters/numbers'),
    description: z.string().optional(),
    headId: z.string().optional(), // validated in controller
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().regex(/^[A-Z0-9]+$/).optional(),
    description: z.string().optional(),
    headId: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
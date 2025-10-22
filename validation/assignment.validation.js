// src/validation/assignment.validation.js
import { z } from 'zod';

export const assignmentIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    courseId: z.string().min(1),
    dueDate: z.string().datetime(),
    totalMarks: z.number().gt(0),
    attachments: z.array(z.string().url()).optional(),
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    totalMarks: z.number().gt(0).optional(),
    attachments: z.array(z.string().url()).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field required',
  }),
});
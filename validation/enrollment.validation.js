// src/validation/enrollment.validation.js
import { z } from 'zod';

const semesterEnum = z.enum(['FALL', 'SPRING', 'SUMMER']);

export const enrollmentIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const createEnrollmentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    semester: semesterEnum,
    year: z.number().int().min(2000).max(2100),
  }),
});
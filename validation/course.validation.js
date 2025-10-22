// src/validation/course.validation.js
import { z } from 'zod';

const semesterEnum = z.enum(['FALL', 'SPRING', 'SUMMER']);

export const courseIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Course ID is required'),
  }),
});

export const getCoursesQuerySchema = z.object({
  query: z.object({
    semester: semesterEnum.optional(),
    departmentId: z.string().optional(),
    teacherId: z.string().optional(),
  }).optional(),
});

export const createCourseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required').regex(/^[A-Z0-9\-_]+$/, 'Invalid course code format'),
    credits: z.number().int().min(1).max(10),
    description: z.string().optional(),
    semester: semesterEnum,
    year: z.number().int().min(2000).max(2100),
    departmentId: z.string().min(1, 'Department ID is required'),
    teacherId: z.string().min(1, 'Teacher ID is required'),
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().regex(/^[A-Z0-9\-_]+$/).optional(),
    credits: z.number().int().min(1).max(10).optional(),
    description: z.string().optional(),
    semester: semesterEnum.optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    departmentId: z.string().min(1).optional(),
    teacherId: z.string().min(1).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
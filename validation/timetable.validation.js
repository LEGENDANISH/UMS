// src/validation/timetable.validation.js
import { z } from 'zod';

// Validates "HH:mm" format (e.g., "09:00", "14:30")
const timeString = (fieldName) =>
  z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, `${fieldName} must be in HH:mm format`);

export const timetableIdSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Timetable ID is required') }),
});

export const dayOfWeekParamSchema = z.object({
  params: z.object({
    dayOfWeek: z
      .string()
      .regex(/^[0-6]$/, 'dayOfWeek must be an integer from 0 (Sunday) to 6 (Saturday)'),
  }),
});

export const createTimetableSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: timeString('Start time'),
    endTime: timeString('End time'),
    roomNumber: z.string().optional(),
  }),
});

export const updateTimetableSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    courseId: z.string().min(1).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: timeString('Start time').optional(),
    endTime: timeString('End time').optional(),
    roomNumber: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});
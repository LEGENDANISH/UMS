// src/validation/attendance.validation.js
import { z } from 'zod';

const statusEnum = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

export const attendanceIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const createAttendanceSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    date: z.string().datetime(), // ISO 8601
    status: statusEnum,
    remarks: z.string().optional(),
  }),
});

export const updateAttendanceSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: statusEnum,
    remarks: z.string().optional(),
  }),
});
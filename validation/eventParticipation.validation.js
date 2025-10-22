// src/validation/eventParticipation.validation.js
import { z } from 'zod';

export const eventIdParamSchema = z.object({
  params: z.object({ eventId: z.string().min(1, 'Event ID is required') }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ studentId: z.string().min(1, 'Student ID is required') }),
});

export const registerForEventSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, 'Event ID is required'),
  }),
});

export const markAttendedSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Participation ID is required') }),
  // No body needed — action is implied
});
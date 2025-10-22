import { z } from 'zod';

const baseEventSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().optional(),
  clubId: z.string().optional().nullable(),
  eventDate: z.coerce.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  venue: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  registrationDeadline: z.coerce.date().optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  banner: z.string().url().optional(),
});

export const createEventSchema = baseEventSchema;

export const updateEventSchema = baseEventSchema.partial();

export const eventIdSchema = z.object({
  id: z.string().min(1),
});

export const clubIdParamSchema = z.object({
  clubId: z.string().min(1),
});

export const getEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().optional(),
});
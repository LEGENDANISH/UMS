import { z } from 'zod';

// Hostel
export const createHostelSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['Boys', 'Girls']),
  totalRooms: z.number().int().positive(),
  warden: z.string().optional(),
});

export const hostelIdSchema = z.object({
  id: z.string().min(1),
});

// Room (not directly created via API in this spec, but used in allocations)
// Allocation
export const createAllocationSchema = z.object({
  roomId: z.string().min(1),
  studentId: z.string().min(1),
});

export const allocationIdSchema = z.object({
  id: z.string().min(1),
});

export const studentIdParamSchema = z.object({
  studentId: z.string().min(1),
});

// Query
export const getHostelsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(['Boys', 'Girls']).optional(),
});
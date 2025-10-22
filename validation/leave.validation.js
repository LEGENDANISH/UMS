// src/validation/leave.validation.js
import { z } from 'zod';

const leaveStatusEnum = z.enum(['APPROVED', 'REJECTED']);

export const leaveIdSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Leave ID is required') }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ studentId: z.string().min(1) }),
});

export const createLeaveSchema = z.object({
  body: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
  }),
});

export const reviewLeaveSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: leaveStatusEnum,
    remarks: z.string().optional(),
  }),
});
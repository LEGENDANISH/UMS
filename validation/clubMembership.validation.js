// src/validation/clubMembership.validation.js
import { z } from 'zod';

const membershipStatusEnum = z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED']);
const membershipRole = z.enum(['MEMBER', 'LEADER', 'CO_LEADER']);

export const membershipIdSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Membership ID is required') }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ studentId: z.string().min(1) }),
});

export const createMembershipSchema = z.object({
  body: z.object({
    clubId: z.string().min(1, 'Club ID is required'),
  }),
});

export const updateMembershipSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    role: membershipRole.optional(),
    status: membershipStatusEnum.optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (role or status) must be provided',
  }),
});
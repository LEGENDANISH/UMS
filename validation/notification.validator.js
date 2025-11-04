import { z } from 'zod';

// For marking as read
export const markAsReadSchema = z.object({
  isRead: z.literal(true),
});

// For broadcast (admin-only)
export const broadcastNotificationSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'At least one user ID required'),
  title: z.string().min(1).max(150),
  message: z.string().min(1).max(1000),
  type: z.string().min(1).max(50),
  link: z.string().url().optional(),
});

// Params
export const notificationIdSchema = z.object({
  id: z.string().min(1),
});

// Query
export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isRead: z.enum(['true', 'false']).optional(),
});
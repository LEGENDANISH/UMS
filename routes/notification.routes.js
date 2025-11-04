import { Router } from 'express';
import {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  deleteNotification,
  broadcastNotification,
} from '../controllers/notification.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  notificationIdSchema,
  getNotificationsQuerySchema,
  markAsReadSchema,
  broadcastNotificationSchema,
} from '../validation/notification.validator.js';

const router = Router();

// User-specific notifications
router.get(
  '/',
  authenticate,
  validate({ query: getNotificationsQuerySchema }),
  getNotifications
);

router.get(
  '/:id',
  authenticate,
  validate({ params: notificationIdSchema }),
  getNotificationById
);

router.patch(
  '/:id',
  authenticate,
  validate({ params: notificationIdSchema, body: markAsReadSchema }),
  markNotificationAsRead
);

router.delete(
  '/:id',
  authenticate,
  validate({ params: notificationIdSchema }),
  deleteNotification
);

// Admin-only broadcast
router.post(
  '/broadcast',
  authenticate,
  authorizeRoles(['ADMIN', 'MANAGEMENT']),
  validate({ body: broadcastNotificationSchema }),
  broadcastNotification
);

export default router;
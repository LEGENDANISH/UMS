  import { Router } from 'express';
  import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByClub,
    getUpcomingEvents,
  } from '../controllers/event.controller.js';
  import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
  import { validate } from '../middleware/validate.middleware.js';
  import {
    createEventSchema,
    updateEventSchema,
    eventIdSchema,
    clubIdParamSchema,
    getEventsQuerySchema,
  } from '../validation/event.validator.js';

  const router = Router();

  // Public or authenticated read access
  router.get('/', validate({ query: getEventsQuerySchema }), authenticate, getEvents);
  router.get('/upcoming', authenticate, getUpcomingEvents);
  router.get('/by-club/:clubId', validate({ params: clubIdParamSchema }), authenticate, getEventsByClub);
  router.get('/:id', validate({ params: eventIdSchema }), authenticate, getEventById);

  // Write access: Admin, Management, or Club Coordinator
  router.post(
    '/',
    authenticate,
    authorizeRoles(['ADMIN', 'MANAGEMENT', 'CLUB_COORDINATOR']),
    validate({ body: createEventSchema }),
    createEvent
  );

  router.patch(
    '/:id',
    authenticate,
    authorizeRoles(['ADMIN', 'MANAGEMENT', 'CLUB_COORDINATOR']),
    validate({ params: eventIdSchema, body: updateEventSchema }),
    updateEvent
  );

  router.delete(
    '/:id',
    authenticate,
    authorizeRoles(['ADMIN', 'MANAGEMENT']),
    validate({ params: eventIdSchema }),
    deleteEvent
  );

  export default router;
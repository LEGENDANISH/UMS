import { Router } from 'express';
import {
  getClubBudgets,
  createClubBudget,
  getClubBudgetsByClub,
} from '../controllers/clubBudget.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createClubBudgetSchema,
  getBudgetsQuerySchema,
  getBudgetsByClubSchema,
} from '../validation/clubBudget.validator.js';

const router = Router();

// Public or authenticated read access
router.get(
  '/',
  validate({ query: getBudgetsQuerySchema }),
  authenticate,
  getClubBudgets
);

// POST requires authorization
router.post(
  '/',
  authenticate,
  authorizeRoles(['ADMIN', 'MANAGEMENT', 'CLUB_COORDINATOR']),
  validate({ body: createClubBudgetSchema }),
  createClubBudget
);

// Get budgets by club ID
router.get(
  '/by-club/:clubId',
  validate({ params: getBudgetsByClubSchema }),
  authenticate,
  getClubBudgetsByClub
);

export default router;
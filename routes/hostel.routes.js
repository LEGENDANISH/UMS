import { Router } from 'express';
import {
  getHostels,
  getHostelById,
  createHostel,
  getHostelRooms,
  allocateHostelRoom,
  vacateHostelRoom,
  getAllocationsByStudent,
} from '../controllers/hostel.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createHostelSchema,
  hostelIdSchema,
  createAllocationSchema,
  allocationIdSchema,
  studentIdParamSchema,
  getHostelsQuerySchema,
} from '../validation/hostel.validator.js';

const router = Router();

// Public or authenticated read access
router.get(
  '/',
  authenticate,
  validate({ query: getHostelsQuerySchema }),
  getHostels
);

router.get(
  '/:id',
  authenticate,
  validate({ params: hostelIdSchema }),
  getHostelById
);

router.get(
  '/:id/rooms',
  authenticate,
  validate({ params: hostelIdSchema }),
  getHostelRooms
);

// Admin/Management write access
router.post(
  '/',
  authenticate,
  authorizeRoles(['ADMIN', 'MANAGEMENT']),
  validate({ body: createHostelSchema }),
  createHostel
);

// Allocations
router.post(
  '/hostel-allocations',
  authenticate,
  authorizeRoles(['ADMIN', 'MANAGEMENT']),
  validate({ body: createAllocationSchema }),
  allocateHostelRoom
);

router.patch(
  '/hostel-allocations/:id',
  authenticate,
  authorizeRoles(['ADMIN', 'MANAGEMENT']),
  validate({ params: allocationIdSchema }),
  vacateHostelRoom
);

router.get(
  '/hostel-allocations/by-student/:studentId',
  authenticate,
  validate({ params: studentIdParamSchema }),
  getAllocationsByStudent
);

export default router;
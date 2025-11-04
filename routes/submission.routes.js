// src/routes/submission.routes.js
import { Router } from 'express';
import * as submissionCtrl from '../controllers/submission.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createSubmissionSchema,
  gradeSubmissionSchema,
  submissionIdSchema,
} from '../validation/submission.validation.js';

const router = Router();

// Student: submit assignment
router.post(
  '/',
  authenticate,
  authorizeRoles('STUDENT'),
  validate(createSubmissionSchema),
  submissionCtrl.createSubmission
);

// Teacher: grade submission
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('TEACHER'),
  validate(gradeSubmissionSchema),
  submissionCtrl.gradeSubmission
);

// Read routes (authenticated)
router.get('/by-student/:studentId', authenticate, submissionCtrl.getByStudent);
router.get('/by-assignment/:assignmentId', authenticate, submissionCtrl.getByAssignment);

export default router;
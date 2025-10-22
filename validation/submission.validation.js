// src/validation/submission.validation.js
import { z } from 'zod';

export const submissionIdSchema = z.object({
  params: z.object({ id: z.string().min(1, 'Submission ID is required') }),
});

export const createSubmissionSchema = z.object({
  body: z.object({
    assignmentId: z.string().min(1, 'Assignment ID is required'),
    attachments: z.array(z.string().url()).optional(),
    remarks: z.string().optional(),
  }),
});

export const gradeSubmissionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    marksObtained: z.number().gte(0).optional(),
    feedback: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one grading field (marks or feedback) is required',
  }),
});
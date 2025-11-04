// src/validation/grade.validation.js
import { z } from 'zod';

const semesterEnum = z.enum(['FALL', 'SPRING', 'SUMMER']);

export const gradeIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const createGradeSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    examType: z.string().min(1),
    marksObtained: z.number().gte(0),
    totalMarks: z.number().gt(0),
    grade: z.string().optional(),
    gpa: z.number().min(0).max(4).optional(),
    semester: semesterEnum,
    year: z.number().int().min(2000).max(2100),
    remarks: z.string().optional(),
  }),
});

export const updateGradeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    marksObtained: z.number().gte(0).optional(),
    totalMarks: z.number().gt(0).optional(),
    grade: z.string().optional(),
    gpa: z.number().min(0).max(4).optional(),
    remarks: z.string().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field required',
  }),
});
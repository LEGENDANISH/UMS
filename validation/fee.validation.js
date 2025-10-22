// src/validation/fee.validation.js
import { z } from 'zod';

const semesterEnum = z.enum(['FALL', 'SPRING', 'SUMMER']);
const feeStatusEnum = z.enum(['PAID', 'PENDING', 'OVERDUE', 'PARTIALLY_PAID']);

export const feeRecordIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const feeRecordIdParamSchema = z.object({
  params: z.object({ feeRecordId: z.string().min(1) }),
});

export const createFeeRecordSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    semester: semesterEnum,
    year: z.number().int().min(2000).max(2100),
    totalAmount: z.number().positive(),
    dueDate: z.string().datetime(),
  }),
});

export const updateFeeRecordSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    totalAmount: z.number().positive().optional(),
    dueDate: z.string().datetime().optional(),
    status: feeStatusEnum.optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field required',
  }),
});

export const createFeeTransactionSchema = z.object({
  body: z.object({
    feeRecordId: z.string().min(1),
    amount: z.number().positive(),
    paymentMethod: z.string().min(1),
    transactionId: z.string().optional(),
    receiptNumber: z.string().min(1),
    remarks: z.string().optional(),
  }),
});
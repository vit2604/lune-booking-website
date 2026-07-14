import { z } from 'zod';
import { isValidPhoneNumber } from '../../utils/phoneValidation.js';

const phoneBody = {
  phoneCode: z.string().trim().min(1).max(20),
  phoneNumber: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[0-9+\-().\s]+$/, 'Phone number contains invalid characters'),
};

function validatePhoneBody(body, ctx) {
  if (!isValidPhoneNumber(body)) {
    ctx.addIssue({
      code: 'custom',
      path: ['phoneNumber'],
      message: 'Phone number is invalid for the selected country code',
    });
  }
}

export const phoneOtpRequestSchema = z.object({
  body: z.object(phoneBody).superRefine(validatePhoneBody),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const phoneOtpVerifySchema = z.object({
  body: z.object({
    ...phoneBody,
    challengeId: z.string().min(1).optional(),
    code: z.string().trim().min(4).max(12),
  }).superRefine(validatePhoneBody),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

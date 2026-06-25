import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    guestName: z.string().trim().max(120).optional(),
    guestPhone: z.string().trim().max(60).optional(),
    guestEmail: z.string().trim().email().max(160).optional().or(z.literal('')),
    language: z.string().trim().max(12).default('en'),
    bookingCode: z.string().trim().max(40).optional(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const guestMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    guestName: z.string().trim().max(120).optional(),
  }),
  params: z.object({ sessionCode: z.string().min(1) }),
  query: z.object({}).passthrough(),
});

export const adminMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
  }),
  params: z.object({ sessionCode: z.string().min(1) }),
  query: z.object({}).passthrough(),
});

import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    guestName: z.string().optional(),
    guestPhone: z.string().optional(),
    guestEmail: z.string().email().optional().or(z.literal('')),
    language: z.string().default('en'),
    bookingCode: z.string().optional(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const guestMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    guestName: z.string().optional(),
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

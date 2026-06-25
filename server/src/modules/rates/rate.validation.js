import { z } from 'zod';

export const ratePeriodQuerySchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({
    roomId: z.string().min(1).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
  body: z.object({}).passthrough(),
});

export const ratePeriodParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const ratePeriodSchema = z.object({
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  body: z.object({
    roomId: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    price: z.coerce.number().int().positive(),
    note: z.string().max(300).optional(),
  }),
});

export const updateRatePeriodSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough(),
  body: z.object({
    roomId: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    price: z.coerce.number().int().positive(),
    note: z.string().max(300).optional(),
  }),
});

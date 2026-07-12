import { z } from 'zod';

export const bluejayDiagnosticsQuerySchema = z.object({
  query: z.object({
    roomId: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.coerce.number().int().positive().max(20).default(1),
    adults: z.coerce.number().int().positive().max(20).optional(),
    children: z.coerce.number().int().nonnegative().max(20).optional(),
  }),
  params: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

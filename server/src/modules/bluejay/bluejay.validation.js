import { z } from 'zod';

export const bluejayDiagnosticsQuerySchema = z.object({
  query: z.object({
    roomId: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.coerce.number().int().positive().max(20).default(1),
  }),
  params: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

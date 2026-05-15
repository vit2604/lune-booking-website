import { z } from 'zod';

export const adminLoginSchema = z.object({
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

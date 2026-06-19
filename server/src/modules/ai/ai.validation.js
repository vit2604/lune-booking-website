import { z } from 'zod';

export const translateSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(1200),
    sourceLanguage: z.string().trim().max(12).optional().default('auto'),
    targetLanguage: z.string().trim().min(2).max(12),
  }),
});

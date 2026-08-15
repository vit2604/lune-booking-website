import { z } from 'zod';

export const captionSchema = z.object({
  primary_language: z.literal('vi').default('vi'), secondary_language: z.literal('en').default('en'),
  headline: z.string().min(1).max(200), caption_vi: z.string().min(1).max(5000), caption_en: z.string().min(1).max(5000),
  caption_ko_optional: z.string().max(5000).nullable().optional(), short_caption: z.string().min(1).max(500),
  cta: z.string().min(1).max(300), hashtags: z.array(z.string().regex(/^#[\p{L}\p{N}_]+$/u)).max(12), alt_text: z.string().min(1).max(500),
  facts_used: z.array(z.string()).max(30), source_ids: z.array(z.string()).max(30).default([]), risk_flags: z.array(z.string()).max(30).default([]),
  confidence: z.number().min(0).max(1), recommended_publish_time: z.string().datetime().nullable().optional(), provider: z.string().optional(),
}).strict();

export function parseCaption(value) { return captionSchema.parse(value); }

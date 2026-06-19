import { z } from 'zod';

export const publicRoomsQuerySchema = z.object({
  query: z.object({
    lang: z.string().default('en').optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.coerce.number().int().positive().optional(),
    currency: z.string().optional(),
    status: z.string().optional(),
  }),
  params: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const availabilityQuerySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({
    checkIn: z.string().min(1),
    checkOut: z.string().min(1),
    guests: z.coerce.number().int().positive().default(1),
  }),
  body: z.object({}).passthrough(),
});

export const roomParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const roomSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({
    lang: z.string().default('en').optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.coerce.number().int().positive().optional(),
  }),
  body: z.object({}).passthrough(),
});

export const adminRoomSchema = z.object({
  body: z.object({
    slug: z.string().min(1).optional(),
    name: z.string().min(1),
    shortDescription: z.string().default(''),
    fullDescription: z.string().default(''),
    priceNote: z.string().optional(),
    basePrice: z.coerce.number().int().positive(),
    weekendPrice: z.coerce.number().int().nonnegative().nullable().optional(),
    holidayPrice: z.coerce.number().int().nonnegative().nullable().optional(),
    size: z.string().min(1),
    maxGuests: z.coerce.number().int().positive(),
    bedType: z.string().min(1),
    numberOfBeds: z.coerce.number().int().positive().default(1),
    status: z.enum(['ACTIVE', 'HIDDEN', 'UNAVAILABLE']).default('ACTIVE'),
    isFeatured: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
    image: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const roomStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(['ACTIVE', 'HIDDEN', 'UNAVAILABLE']) }),
  query: z.object({}).passthrough(),
});

export const blockedDateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    reason: z.string().optional(),
  }),
  query: z.object({}).passthrough(),
});

export const deleteBlockedDateSchema = z.object({
  params: z.object({ id: z.string().min(1), blockedDateId: z.string().min(1) }),
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

import { z } from 'zod';
import { paymentMethodKeys } from '../../constants/paymentMethods.js';
import { isValidPhoneNumber } from '../../utils/phoneValidation.js';

const bookingRoomSchema = z.object({
  roomId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
  guests: z.coerce.number().int().positive().optional(),
  adults: z.coerce.number().int().positive().optional(),
  children: z.coerce.number().int().nonnegative().optional(),
});

export const createBookingSchema = z.object({
  body: z.object({
    roomId: z.string().min(1).optional(),
    rooms: z.array(bookingRoomSchema).min(1).optional(),
    idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{8,100}$/).optional(),
    checkIn: z.string().min(1),
    checkOut: z.string().min(1),
    guests: z.coerce.number().int().positive(),
    adults: z.coerce.number().int().positive().optional(),
    children: z.coerce.number().int().nonnegative().optional(),
    guest: z.object({
      fullName: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(160).optional().or(z.literal('')),
      phoneCode: z.string().trim().min(1).max(12),
      phoneNumber: z
        .string()
        .trim()
        .min(1)
        .max(40)
        .regex(/^[0-9+\-().\s]+$/, 'Phone number contains invalid characters'),
      country: z.string().trim().min(1).max(80),
      nationality: z.string().trim().max(80).optional(),
    }).superRefine((guest, ctx) => {
      if (!isValidPhoneNumber({
        phoneCode: guest.phoneCode,
        phoneNumber: guest.phoneNumber,
        country: guest.country,
      })) {
        ctx.addIssue({
          code: 'custom',
          path: ['phoneNumber'],
          message: 'Phone number is invalid for the selected country code',
        });
      }
    }),
    specialRequest: z.string().trim().max(1000).optional(),
    arrivalTime: z.string().trim().max(40).optional(),
    paymentMethod: z.enum(paymentMethodKeys).optional(),
    phoneVerificationToken: z.string().trim().min(20).max(200).optional(),
  }).superRefine((body, ctx) => {
    if (!body.roomId && !body.rooms?.length) {
      ctx.addIssue({ code: 'custom', path: ['rooms'], message: 'At least one room is required' });
    }
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const bookingCodeSchema = z.object({
  params: z.object({ bookingCode: z.string().min(1) }),
  query: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const adminBookingsQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    checkInFrom: z.string().optional(),
    checkInTo: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  params: z.object({}).passthrough(),
  body: z.object({}).passthrough(),
});

export const bookingStatusSchema = z.object({
  params: z.object({ bookingCode: z.string().min(1) }),
  body: z.object({ bookingStatus: z.enum(['RECEIVED', 'CONFIRMED', 'CANCELLED']) }),
  query: z.object({}).passthrough(),
});

export const paymentStatusSchema = z.object({
  params: z.object({ bookingCode: z.string().min(1) }),
  body: z.object({ paymentStatus: z.enum(['PENDING', 'PAID', 'PAY_AT_PROPERTY', 'FAILED', 'REFUNDED']) }),
  query: z.object({}).passthrough(),
});

export const internalNoteSchema = z.object({
  params: z.object({ bookingCode: z.string().min(1) }),
  body: z.object({ internalNote: z.string().max(5000).default('') }),
  query: z.object({}).passthrough(),
});

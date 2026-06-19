import { z } from 'zod';
import { paymentMethodKeys } from '../../constants/paymentMethods.js';

export const createBookingSchema = z.object({
  body: z.object({
    roomId: z.string().min(1),
    checkIn: z.string().min(1),
    checkOut: z.string().min(1),
    guests: z.coerce.number().int().positive(),
    guest: z.object({
      fullName: z.string().min(1),
      email: z.string().email().optional().or(z.literal('')),
      phoneCode: z.string().min(1),
      phoneNumber: z.string().min(1),
      country: z.string().min(1),
      nationality: z.string().optional(),
    }),
    specialRequest: z.string().optional(),
    arrivalTime: z.string().optional(),
    paymentMethod: z.enum(paymentMethodKeys).optional(),
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
  body: z.object({ internalNote: z.string().default('') }),
  query: z.object({}).passthrough(),
});

import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { bookingRateLimit } from '../../middlewares/rateLimitMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import {
  adminBooking,
  adminBookings,
  adminDeleteBooking,
  adminUpdateBookingStatus,
  adminUpdateInternalNote,
  adminUpdatePaymentStatus,
  publicBooking,
  publicCreateBooking,
} from './booking.controller.js';
import {
  adminBookingsQuerySchema,
  bookingCodeSchema,
  bookingStatusSchema,
  createBookingSchema,
  internalNoteSchema,
  paymentStatusSchema,
} from './booking.validation.js';

export const publicBookingRouter = Router();
export const adminBookingRouter = Router();

publicBookingRouter.post('/', bookingRateLimit, validate(createBookingSchema), publicCreateBooking);
publicBookingRouter.get('/:bookingCode', validate(bookingCodeSchema), publicBooking);

adminBookingRouter.use(requireAuth, requireAdmin);
adminBookingRouter.get('/', validate(adminBookingsQuerySchema), adminBookings);
adminBookingRouter.get('/:bookingCode', validate(bookingCodeSchema), adminBooking);
adminBookingRouter.patch('/:bookingCode/status', validate(bookingStatusSchema), adminUpdateBookingStatus);
adminBookingRouter.patch('/:bookingCode/payment-status', validate(paymentStatusSchema), adminUpdatePaymentStatus);
adminBookingRouter.patch('/:bookingCode/internal-note', validate(internalNoteSchema), adminUpdateInternalNote);
adminBookingRouter.delete('/:bookingCode', validate(bookingCodeSchema), adminDeleteBooking);

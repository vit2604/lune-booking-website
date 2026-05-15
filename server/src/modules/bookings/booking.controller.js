import { sendSuccess } from '../../utils/responseUtils.js';
import {
  createBooking,
  deleteBooking,
  getAdminBooking,
  getPublicBooking,
  listAdminBookings,
  updateBookingStatus,
  updateInternalNote,
  updatePaymentStatus,
} from './booking.service.js';

export async function publicCreateBooking(req, res, next) {
  try {
    return sendSuccess(res, await createBooking(req.validated.body), 'Booking received', 201);
  } catch (error) {
    return next(error);
  }
}

export async function publicBooking(req, res, next) {
  try {
    return sendSuccess(res, await getPublicBooking(req.validated.params.bookingCode));
  } catch (error) {
    return next(error);
  }
}

export async function adminBookings(req, res, next) {
  try {
    return sendSuccess(res, await listAdminBookings(req.validated.query));
  } catch (error) {
    return next(error);
  }
}

export async function adminBooking(req, res, next) {
  try {
    return sendSuccess(res, await getAdminBooking(req.validated.params.bookingCode));
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdateBookingStatus(req, res, next) {
  try {
    return sendSuccess(
      res,
      await updateBookingStatus(req.validated.params.bookingCode, req.validated.body.bookingStatus),
      'Booking status updated',
    );
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdatePaymentStatus(req, res, next) {
  try {
    return sendSuccess(
      res,
      await updatePaymentStatus(req.validated.params.bookingCode, req.validated.body.paymentStatus),
      'Payment status updated',
    );
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdateInternalNote(req, res, next) {
  try {
    return sendSuccess(
      res,
      await updateInternalNote(req.validated.params.bookingCode, req.validated.body.internalNote),
      'Internal note updated',
    );
  } catch (error) {
    return next(error);
  }
}

export async function adminDeleteBooking(req, res, next) {
  try {
    return sendSuccess(res, await deleteBooking(req.validated.params.bookingCode), 'Booking cancelled');
  } catch (error) {
    return next(error);
  }
}

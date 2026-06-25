import { Prisma } from '@prisma/client';

export function notFoundMiddleware(req, _res, next) {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
}

export function errorMiddleware(error, req, res, _next) {
  const isProduction = process.env.NODE_ENV === 'production';
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Unique constraint conflict';
    }
    if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  if (statusCode >= 500) console.error(error);
  if (isProduction && statusCode >= 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: statusCode >= 500 ? null : error.errors || null,
    requestId: req.id,
  });
}

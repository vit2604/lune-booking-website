import { Prisma } from '@prisma/client';

export function notFoundMiddleware(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorMiddleware(error, _req, res, _next) {
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

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || null,
  });
}

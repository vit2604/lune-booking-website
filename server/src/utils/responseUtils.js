export function sendSuccess(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function createHttpError(statusCode, message, errors) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

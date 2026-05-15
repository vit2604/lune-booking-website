import { createHttpError } from '../utils/responseUtils.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(createHttpError(400, 'Validation error', result.error.flatten()));
    }

    req.validated = result.data;
    return next();
  };
}

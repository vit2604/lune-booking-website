import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { createHttpError } from '../utils/responseUtils.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw createHttpError(401, 'Unauthorized');

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw createHttpError(401, 'Unauthorized');

    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (error) {
    return next(error.statusCode ? error : createHttpError(401, 'Unauthorized'));
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'ADMIN') return next(createHttpError(403, 'Forbidden'));
  return next();
}

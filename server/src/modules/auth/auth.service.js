import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { createHttpError } from '../../utils/responseUtils.js';

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
  };
}

export async function loginAdmin({ username, password }) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) throw createHttpError(401, 'Invalid username or password');

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) throw createHttpError(401, 'Invalid username or password');
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') throw createHttpError(403, 'Forbidden');

  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, admin: sanitizeUser(user) };
}

export function getMe(user) {
  return user;
}

import crypto from 'node:crypto';
import { prisma } from '../../../config/prisma.js';
import { retryDelayMs } from '../domain/retry.js';
import { safeError } from '../security/redaction.js';

export function isTerminalJobFailure(job, error) {
  const status = Number(error?.status || error?.statusCode || 0);
  return error?.retryable === false || [400, 401, 403, 404].includes(status) || job.attempts >= job.maxAttempts;
}

export class DatabaseJobScheduler {
  async enqueue({ type, payload = {}, scheduledAt = new Date(), idempotencyKey, maxAttempts = 5 }) {
    return prisma.aiJob.upsert({ where: { idempotencyKey }, update: {}, create: { type, payload, scheduledAt, idempotencyKey, maxAttempts } });
  }

  async claimNext(workerId, leaseMs = 60_000) {
    const token = crypto.randomUUID();
    const rows = await prisma.$queryRaw`
      WITH candidate AS (
        SELECT id FROM "AiJob"
        WHERE ((state = 'PENDING' AND "scheduledAt" <= NOW()) OR (state = 'RUNNING' AND "leaseExpiresAt" < NOW()))
        ORDER BY "scheduledAt" ASC
        FOR UPDATE SKIP LOCKED LIMIT 1
      )
      UPDATE "AiJob" AS job SET
        state = 'RUNNING', "claimOwner" = ${workerId}, "claimToken" = ${token},
        "claimedAt" = NOW(), "heartbeatAt" = NOW(), "leaseExpiresAt" = NOW() + (${leaseMs} * INTERVAL '1 millisecond'),
        attempts = attempts + 1, "updatedAt" = NOW()
      FROM candidate WHERE job.id = candidate.id
      RETURNING job.*`;
    return rows[0] || null;
  }

  async heartbeat(id, claimToken, leaseMs = 60_000) {
    const result = await prisma.aiJob.updateMany({ where: { id, state: 'RUNNING', claimToken }, data: { heartbeatAt: new Date(), leaseExpiresAt: new Date(Date.now() + leaseMs) } });
    return result.count === 1;
  }

  async complete(id, claimToken) {
    const result = await prisma.aiJob.updateMany({ where: { id, state: 'RUNNING', claimToken }, data: { state: 'SUCCEEDED', finishedAt: new Date(), claimOwner: null, claimToken: null, leaseExpiresAt: null } });
    if (result.count !== 1) throw new Error('Job lease was lost before completion');
  }

  async fail(job, claimToken, error) {
    const terminal = isTerminalJobFailure(job, error);
    const result = await prisma.aiJob.updateMany({ where: { id: job.id, state: 'RUNNING', claimToken }, data: {
      state: terminal ? 'DEAD_LETTER' : 'PENDING', lastError: safeError(error).message,
      scheduledAt: terminal ? job.scheduledAt : new Date(Date.now() + retryDelayMs(job.attempts)),
      finishedAt: terminal ? new Date() : null, claimOwner: null, claimToken: null, leaseExpiresAt: null,
    } });
    if (result.count !== 1) throw new Error('Job lease was lost before failure update');
  }

  async cancel(id) { return prisma.aiJob.updateMany({ where: { id, state: 'PENDING' }, data: { state: 'CANCELLED', finishedAt: new Date() } }); }
}

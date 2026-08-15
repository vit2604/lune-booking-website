import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { DatabaseJobScheduler } from './adapters/databaseJobScheduler.js';
import { checkMetaProcessing, checkMetaTokenHealth, cleanupTemporaryFiles, fetchPublicationAnalytics, generateTodayIdeas, publishPublication, reconcilePublications, refreshTrends, runFullAutoSafe, sendDailyNotification } from './aiContent.service.js';
import { safeError } from './security/redaction.js';

const scheduler = new DatabaseJobScheduler();
const workerId = `${process.pid}-${crypto.randomUUID()}`;
let timer;
let running = false;

function localDayKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

async function seedJobs() {
  const profile = await prisma.aiBusinessProfile.findUnique({ where: { id: 'lune' }, select: { emergencyStop: true } });
  if (profile?.emergencyStop) return;
  const day = localDayKey();
  const [year, month, date] = day.split('-').map(Number);
  const dailyLocal = new Date(Date.UTC(year, month - 1, date, env.AI_CONTENT_DAILY_HOUR - 7, env.AI_CONTENT_DAILY_MINUTE, 0));
  const now = new Date();
  await scheduler.enqueue({ type: 'FETCH_TRENDS', scheduledAt: now, idempotencyKey: `fetch-trends:${day}` });
  await scheduler.enqueue({ type: 'GENERATE_DAILY_IDEAS', scheduledAt: dailyLocal > now ? dailyLocal : new Date(now.getTime() + 60_000), idempotencyKey: `daily-ideas:${day}` });
  await scheduler.enqueue({ type: 'SEND_DAILY_NOTIFICATION', scheduledAt: dailyLocal > now ? new Date(dailyLocal.getTime() + 60_000) : new Date(now.getTime() + 120_000), idempotencyKey: `daily-notification:${day}` });
  await scheduler.enqueue({ type: 'RUN_SAFE_AUTONOMY', scheduledAt: dailyLocal > now ? new Date(dailyLocal.getTime() + 120_000) : new Date(now.getTime() + 180_000), idempotencyKey: `safe-autonomy:${day}` });
  const cleanupLocal = new Date(Date.UTC(year, month - 1, date, -5, 0, 0));
  await scheduler.enqueue({ type: 'CLEAN_TEMP_FILES', scheduledAt: cleanupLocal > now ? cleanupLocal : new Date(cleanupLocal.getTime() + 86_400_000), idempotencyKey: `cleanup-temp:${day}` });
  const metaConnected = await prisma.aiMetaConnection.count({ where: { pageId: env.META_PAGE_ID, disconnectedAt: null } });
  if (metaConnected) await scheduler.enqueue({ type: 'CHECK_TOKEN_HEALTH', scheduledAt: now, idempotencyKey: `meta-token-health:${day}` });
  const due = await prisma.aiPublication.findMany({ where: { state: 'SCHEDULED', scheduledAt: { lte: new Date() } }, select: { id: true } });
  await Promise.all(due.map(({ id }) => scheduler.enqueue({ type: 'PUBLISH_CONTENT', payload: { publicationId: id }, idempotencyKey: `publish:${id}` })));
  const recentPublished = await prisma.aiPublication.findMany({ where: { state: 'PUBLISHED', publishedAt: { gte: new Date(Date.now() - 8 * 86_400_000) } }, include: { analytics: { select: { windowHours: true } } }, take: 100 });
  for (const publication of recentPublished) {
    for (const windowHours of [24, 72, 168]) {
      if (publication.analytics.some((item) => item.windowHours === windowHours)) continue;
      const scheduledAt = new Date(publication.publishedAt.getTime() + windowHours * 3_600_000);
      await scheduler.enqueue({ type: 'FETCH_ANALYTICS', payload: { publicationId: publication.id, windowHours }, scheduledAt, idempotencyKey: `analytics:${publication.id}:${windowHours}` });
    }
  }
  const processing = await prisma.aiPublication.findMany({ where: { state: 'PUBLISHING', publisher: 'meta', remotePostId: { not: null } }, select: { id: true }, take: 20 });
  const processingBucket = Math.floor(Date.now() / 30_000);
  await Promise.all(processing.map(({ id }) => scheduler.enqueue({ type: 'CHECK_META_PROCESSING', payload: { publicationId: id }, scheduledAt: new Date(Date.now() + 30_000), idempotencyKey: `meta-processing:${id}:${processingBucket}` })));
  const unknownCount = await prisma.aiPublication.count({ where: { state: 'PUBLISH_UNKNOWN', reconciliationDue: true } });
  if (unknownCount) {
    const bucket = Math.floor(Date.now() / 300_000);
    await scheduler.enqueue({ type: 'RECONCILE_PUBLICATIONS', scheduledAt: new Date(), idempotencyKey: `reconcile:${bucket}` });
  }
  await prisma.aiPublication.updateMany({ where: { state: 'PUBLISHING', remotePostId: null, claimedAt: { lt: new Date(Date.now() - 10 * 60_000) } }, data: { state: 'PUBLISH_UNKNOWN', reconciliationDue: true, failureCode: 'WORKER_CRASH_WINDOW', failureMessage: 'Publisher dispatch outcome is unknown after worker lease expiry', claimOwner: null } });
}

async function execute(job) {
  if (job.type === 'GENERATE_DAILY_IDEAS') return generateTodayIdeas(null, `job:${job.id}`);
  if (job.type === 'FETCH_TRENDS') return refreshTrends(null, `job:${job.id}`);
  if (job.type === 'SEND_DAILY_NOTIFICATION') return sendDailyNotification(`job:${job.id}`);
  if (job.type === 'FETCH_ANALYTICS') return fetchPublicationAnalytics(job.payload.publicationId, job.payload.windowHours, null, `job:${job.id}`);
  if (job.type === 'CHECK_META_PROCESSING') return checkMetaProcessing(job.payload.publicationId, `job:${job.id}`);
  if (job.type === 'RECONCILE_PUBLICATIONS') return reconcilePublications(`job:${job.id}`);
  if (job.type === 'RUN_SAFE_AUTONOMY') return runFullAutoSafe(`job:${job.id}`);
  if (job.type === 'CLEAN_TEMP_FILES') return cleanupTemporaryFiles(`job:${job.id}`);
  if (job.type === 'CHECK_TOKEN_HEALTH') return checkMetaTokenHealth(`job:${job.id}`);
  if (job.type === 'PUBLISH_CONTENT') return publishPublication(job.payload.publicationId, null, `job:${job.id}`);
  throw new Error(`Unsupported job type: ${job.type}`);
}

async function tick() {
  if (running) return;
  running = true;
  try {
    await seedJobs();
    const stopped = await prisma.aiBusinessProfile.findUnique({ where: { id: 'lune' }, select: { emergencyStop: true } });
    if (stopped?.emergencyStop) return;
    const job = await scheduler.claimNext(workerId);
    if (!job) return;
    const heartbeat = setInterval(() => scheduler.heartbeat(job.id, job.claimToken).catch(() => {}), 20_000); heartbeat.unref();
    try { await execute(job); await scheduler.complete(job.id, job.claimToken); }
    catch (error) { await scheduler.fail(job, job.claimToken, error); }
    finally { clearInterval(heartbeat); }
  } finally { running = false; }
}

export function startAiContentWorker() {
  if (!env.AI_CONTENT_ENABLED || !env.AI_CONTENT_WORKER_ENABLED || timer) return () => {};
  const reportError = (error) => console.error(JSON.stringify({ level: 'error', component: 'ai-content-worker', at: new Date().toISOString(), error: safeError(error) }));
  tick().catch(reportError);
  timer = setInterval(() => tick().catch(reportError), 30_000); timer.unref();
  return () => { clearInterval(timer); timer = undefined; };
}

export { scheduler };

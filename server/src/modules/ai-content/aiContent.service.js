import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { DeterministicTemplateProvider, FallbackLLMProvider, OllamaLLMProvider } from './adapters/llmProviders.js';
import { LocalMediaStorage } from './adapters/localMediaStorage.js';
import { MockPublisher, MetaPagePublisher } from './adapters/publishers.js';
import { FFmpegVideoRenderer, SharpImageRenderer } from './adapters/renderers.js';
import { MetaAnalyticsProvider, MockAnalyticsProvider, OfficialDanangTrendSource } from './adapters/signalsAndAnalytics.js';
import { InAppNotificationProvider } from './adapters/notifications.js';
import { OpenCvPrivacyAnalyzer } from './adapters/privacyAnalyzer.js';
import { assertFacts } from './domain/factGuard.js';
import { parseCaption } from './domain/captionSchema.js';
import { publicationContentHash } from './domain/contentHash.js';
import { assertTransition } from './domain/stateMachine.js';
import { detectMime, safeStoredFilename, sha256File } from './domain/uploadSecurity.js';
import { safeError } from './security/redaction.js';
import { encryptMetaToken } from './security/tokenCrypto.js';
import { repetitionPenalty, scoreTrend } from './domain/trendScoring.js';

const mediaStorage = new LocalMediaStorage(env.AI_CONTENT_MEDIA_ROOT);
const imageRenderer = new SharpImageRenderer();
const videoRenderer = new FFmpegVideoRenderer({ ffmpegPath: env.FFMPEG_PATH, ffprobePath: env.FFPROBE_PATH });
const templateProvider = new DeterministicTemplateProvider();
const llmProvider = new FallbackLLMProvider([
  ...(env.OLLAMA_MODEL ? [new OllamaLLMProvider({ baseUrl: env.OLLAMA_BASE_URL, model: env.OLLAMA_MODEL })] : []),
  templateProvider,
]);
const trendSource = new OfficialDanangTrendSource(prisma);
const notifications = new InAppNotificationProvider(prisma);
const privacyAnalyzer = new OpenCvPrivacyAnalyzer({ enabled: env.AI_CONTENT_OPENCV_ENABLED, pythonPath: env.AI_CONTENT_PYTHON_PATH });

const profileSeed = {
  id: 'lune', brandName: 'Lune Boutique Apartment', address: '92–94 Thạch Lam, An Hải, Đà Nẵng',
  hotline: '0867 802 229', website: 'https://luneboutiquedanang.com',
  verifiedFacts: ['Lune Boutique Apartment', '92–94 Thạch Lam, An Hải, Đà Nẵng', '0867 802 229', 'https://luneboutiquedanang.com'],
  allowedCtas: ['Liên hệ 0867 802 229', 'Xem thêm tại https://luneboutiquedanang.com'], languages: ['vi', 'en'],
  toneOfVoice: 'Thân thiện, chuyên nghiệp, tự nhiên',
  forbiddenClaims: ['giá chưa xác minh', 'ưu đãi chưa xác minh', 'phòng trống chưa xác minh', 'khoảng cách chưa xác minh', 'đánh giá khách chưa xác minh'],
  trendKeywords: ['Đà Nẵng', 'du lịch Đà Nẵng', 'biển Mỹ Khê', 'An Hải', 'Sơn Trà', 'Cầu Rồng', 'DIFF', 'Da Nang travel', 'My Khe Beach'],
  autonomyMode: env.AI_CONTENT_AUTONOMY_MODE,
};

function startOfTodayUtc() {
  const now = new Date();
  const local = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 7 * 60 * 60 * 1000);
}

function jsonSafeMedia(media) {
  return { ...media, fileSizeBytes: media.fileSizeBytes == null ? null : String(media.fileSizeBytes), storageKey: undefined };
}

function draftDto(draft) {
  return { ...draft, assets: draft.assets?.map((asset) => ({ ...asset, mediaAsset: asset.mediaAsset ? jsonSafeMedia(asset.mediaAsset) : undefined })) };
}

async function storageDiagnostics() {
  try {
    await fs.mkdir(path.resolve(env.AI_CONTENT_MEDIA_ROOT), { recursive: true });
    const stat = await fs.statfs(path.resolve(env.AI_CONTENT_MEDIA_ROOT));
    return { availableBytes: Number(stat.bavail) * Number(stat.bsize), totalBytes: Number(stat.blocks) * Number(stat.bsize) };
  } catch (error) { return { availableBytes: null, totalBytes: null, error: safeError(error).message }; }
}

async function audit(actorId, action, entityType, entityId, details, correlationId) {
  return prisma.aiAuditLog.create({ data: { actorId, action, entityType, entityId, correlationId, details: details || undefined } });
}

export async function ensureBusinessProfile() {
  return prisma.aiBusinessProfile.upsert({ where: { id: 'lune' }, create: profileSeed, update: {} });
}

export async function updateAiContentSettings({ autonomyMode, trendKeywords }, actorId, correlationId) {
  await ensureBusinessProfile();
  const keywords = [...new Set(trendKeywords.map((item) => String(item).trim()).filter(Boolean))].slice(0, 40);
  const profile = await prisma.aiBusinessProfile.update({ where: { id: 'lune' }, data: { autonomyMode, trendKeywords: keywords, updatedById: actorId } });
  await audit(actorId, 'UPDATE_AI_CONTENT_SETTINGS', 'business_profile', profile.id, { autonomyMode, trendKeywordCount: keywords.length }, correlationId);
  return profile;
}

export async function getDashboard() {
  const today = startOfTodayUtc();
  const [profile, ideas, recentUploads, recentPublications, draftsAwaiting, scheduled, failures, queueDepth, failedJobs, lastPublish, activeTrends, analytics, recentNotifications, lastTrend, workerHeartbeat, metaConnection, storage] = await Promise.all([
    ensureBusinessProfile(),
    prisma.aiContentIdea.findMany({ where: { createdAt: { gte: today }, status: { not: 'ARCHIVED' } }, include: { shotItems: { orderBy: { sortOrder: 'asc' } } }, orderBy: { priority: 'desc' }, take: 3 }),
    prisma.mediaAsset.findMany({ where: { source: 'UPLOAD', deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.aiPublication.findMany({ include: { draft: { select: { headline: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.aiContentDraft.count({ where: { state: { in: ['DRAFT_READY', 'AWAITING_APPROVAL'] } } }),
    prisma.aiPublication.count({ where: { state: 'SCHEDULED' } }),
    prisma.aiPublication.count({ where: { state: { in: ['PUBLISH_FAILED', 'PUBLISH_UNKNOWN'] } } }),
    prisma.aiJob.count({ where: { state: 'PENDING' } }),
    prisma.aiJob.count({ where: { state: { in: ['FAILED', 'DEAD_LETTER'] } } }),
    prisma.aiPublication.findFirst({ where: { state: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, select: { publishedAt: true, remotePermalink: true } }),
    prisma.aiTrendSignal.count({ where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
    analyticsOverview(),
    prisma.aiAuditLog.findMany({ where: { entityType: 'notification' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, action: true, details: true, createdAt: true } }),
    prisma.aiTrendSignal.findFirst({ orderBy: { fetchedAt: 'desc' }, select: { fetchedAt: true, source: true } }),
    prisma.aiJob.findFirst({ where: { heartbeatAt: { not: null } }, orderBy: { heartbeatAt: 'desc' }, select: { heartbeatAt: true, state: true, type: true } }),
    prisma.aiMetaConnection.findFirst({ where: { pageId: env.META_PAGE_ID, disconnectedAt: null }, select: { pageId: true, pageName: true, tokenExpiresAt: true, lastHealthCheckAt: true } }),
    storageDiagnostics(),
  ]);
  const ollama = await new OllamaLLMProvider({ baseUrl: env.OLLAMA_BASE_URL, model: env.OLLAMA_MODEL }).health();
  const ffmpeg = await videoRenderer.health();
  return { profile, ideas, recentUploads: recentUploads.map(jsonSafeMedia), recentPublications, counts: { draftsAwaiting, scheduled, failures, queueDepth, failedJobs, activeTrends }, analytics: analytics.totals, recentNotifications, diagnostics: { ollama, ffmpeg, workerEnabled: env.AI_CONTENT_WORKER_ENABLED, workerHeartbeat, emergencyStop: profile.emergencyStop, runtimeCost: '0 VND', liveMetaEnabled: env.AI_CONTENT_LIVE_META_ENABLED, metaConnection, lastTrend, lastPublish, storage } };
}

const evergreenIdeas = [
  { title: 'Buổi sáng nhẹ nhàng tại Lune', objective: 'Giới thiệu không gian thật', audience: 'Khách đang lên kế hoạch đến Đà Nẵng', contentPillar: 'ROOMS', outputType: 'REEL', keyMessage: 'Một buổi sáng thư thái trong không gian thật của Lune', rationale: 'Evergreen, an toàn khi chưa có trend đủ tin cậy', priority: 90, instruction: 'Quay mặt tiền Lune vào buổi sáng', acceptance: 'Hình ổn định, đủ sáng, không có mặt khách hoặc biển số rõ' },
  { title: 'Góc phòng được chăm chút hôm nay', objective: 'Cho thấy trải nghiệm lưu trú chân thực', audience: 'Khách thích không gian gọn gàng', contentPillar: 'ROOMS', outputType: 'CAROUSEL', keyMessage: 'Những chi tiết thật tạo nên cảm giác dễ chịu', rationale: 'Dùng tài sản Lune, không cần claim bên ngoài', priority: 80, instruction: 'Chụp một góc phòng đã được chuẩn bị hoàn chỉnh', acceptance: 'Ảnh thẳng, sáng tự nhiên, không có thông tin khách' },
  { title: 'Hậu trường chuẩn bị phòng', objective: 'Tăng sự tin cậy', audience: 'Khách quan tâm chất lượng vận hành', contentPillar: 'BEHIND_THE_SCENES', outputType: 'REEL', keyMessage: 'Sự chỉn chu phía sau mỗi lượt lưu trú', rationale: 'Evergreen và có thể quay trong 10–15 phút', priority: 70, instruction: 'Quay thao tác chuẩn bị khăn hoặc vật dụng phòng', acceptance: 'Không lộ khuôn mặt khách, booking code hoặc màn hình nội bộ' },
];

async function generateTodayIdeasLocked(db, actorId, correlationId) {
  const existing = await db.aiContentIdea.findMany({ where: { createdAt: { gte: startOfTodayUtc() }, status: { not: 'ARCHIVED' } }, include: { shotItems: true }, take: 3 });
  if (existing.length >= 3) return existing;
  const remaining = 3 - existing.length;
  const topTrend = await db.aiTrendSignal.findFirst({
    where: { score: { gte: 60 }, riskFlags: { equals: [] }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: [{ score: 'desc' }, { publishedAt: 'desc' }],
  });
  const candidates = [];
  if (topTrend && !existing.some((item) => item.trendId === topTrend.id)) candidates.push({
    trendId: topTrend.id, title: `Gợi ý theo thông tin địa phương: ${topTrend.title}`,
    objective: 'Kết nối trải nghiệm lưu trú với thông tin du lịch địa phương đã dẫn nguồn',
    audience: 'Khách đang lên kế hoạch đến Đà Nẵng', contentPillar: 'LOCAL_GUIDE', outputType: 'CAROUSEL',
    keyMessage: 'Gợi ý tham khảo cho hành trình tại Đà Nẵng; cần kiểm tra thời gian và chi tiết trước khi đăng',
    rationale: `Nguồn chính thức, điểm ${topTrend.score}; chỉ sử dụng tiêu đề, ngày và liên kết nguồn`,
    sourceUrl: topTrend.sourceUrl, expiresAt: topTrend.expiresAt, priority: Math.min(95, Math.round(topTrend.score || 60)),
    claimsToVerify: [topTrend.title, topTrend.publishedAt?.toISOString()].filter(Boolean), allowedMode: 'REVIEW_REQUIRED',
    instruction: 'Chụp một góc Lune phù hợp; không sao chép hình hoặc nội dung từ bài nguồn',
    acceptance: 'Ảnh do Lune sở hữu, không có mặt khách, thông tin riêng tư hoặc nhãn hiệu bên thứ ba nổi bật',
  });
  const existingTitles = new Set(existing.map((item) => item.title));
  candidates.push(...evergreenIdeas.filter((item) => !existingTitles.has(item.title)).slice(0, remaining - candidates.length).map((item) => ({ ...item, claimsToVerify: [], allowedMode: 'FULL_AUTO_SAFE' })));
  candidates.splice(remaining);
  const created = [...existing];
  let newCount = 0;
  for (const item of candidates) {
    created.push(await db.aiContentIdea.create({ data: {
      trendId: item.trendId || null,
      title: item.title, objective: item.objective, audience: item.audience, contentPillar: item.contentPillar, outputType: item.outputType,
      keyMessage: item.keyMessage, rationale: item.rationale, sourceUrl: item.sourceUrl || null, expiresAt: item.expiresAt || null,
      estimatedMinutes: 15, priority: item.priority, claimsToVerify: item.claimsToVerify, allowedMode: item.allowedMode,
      shotItems: { create: [{ sortOrder: 1, mediaType: item.outputType === 'CAROUSEL' ? 'IMAGE' : 'VIDEO', orientation: 'VERTICAL', aspectRatio: '9:16', durationSeconds: item.outputType === 'CAROUSEL' ? null : 5, instruction: item.instruction, position: 'Giữ máy ngang tầm ngực', cameraDirection: 'Thẳng, không zoom', movement: 'Chậm và ổn định', lighting: 'Ánh sáng tự nhiên', avoid: 'Mặt khách, trẻ em, biển số, hộ chiếu, booking code, màn hình PMS', acceptance: item.acceptance, fallback: 'Quay/chụp góc khác không có người', takes: 2 }] },
    }, include: { shotItems: true } })); newCount += 1;
  }
  await db.aiAuditLog.create({ data: { actorId, action: 'GENERATE_DAILY_IDEAS', entityType: 'idea', entityId: null, correlationId, details: { count: newCount, total: created.length, source: topTrend ? 'official-trend-and-evergreen' : 'evergreen-fallback', trendId: topTrend?.id || null } } });
  return created;
}

export async function generateTodayIdeas(actorId, correlationId) {
  return prisma.$transaction(async (tx) => {
    // Serialize all generators for the local business day so concurrent API and
    // worker calls cannot exceed the three-idea cap.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('lune:daily-content-ideas'))`;
    return generateTodayIdeasLocked(tx, actorId, correlationId);
  });
}

export async function listTrends() { return prisma.aiTrendSignal.findMany({ where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: [{ score: 'desc' }, { fetchedAt: 'desc' }], take: 100 }); }

export async function refreshTrends(actorId, correlationId) {
  const profile = await ensureBusinessProfile();
  const result = await trendSource.fetch(new Date(), { keywords: profile.trendKeywords || [] });
  const [recentIdeas, readyMediaCount] = await Promise.all([
    prisma.aiContentIdea.findMany({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } }, select: { title: true }, take: 100 }),
    prisma.mediaAsset.count({ where: { qualityStatus: 'READY', deletedAt: null, consentStatus: { in: ['GRANTED', 'NOT_REQUIRED'] } } }),
  ]);
  for (const signal of result.signals) {
    const breakdown = { ...(signal.scoreBreakdown || {}), repetitionPenalty: repetitionPenalty({ recentTitles: recentIdeas.map((item) => item.title), title: signal.title }), availableMediaFit: Math.min(100, 40 + readyMediaCount * 15) };
    signal.score = scoreTrend(breakdown); signal.scoreBreakdown = breakdown;
    await prisma.aiTrendSignal.update({ where: { id: signal.id }, data: { score: signal.score, scoreBreakdown: breakdown } });
  }
  await audit(actorId, 'REFRESH_TRENDS', 'trend', null, { count: result.signals.length, partialFailures: result.errors }, correlationId);
  return { count: result.signals.length, partialFailures: result.errors, trends: await listTrends() };
}

export async function fetchPublicationAnalytics(publicationId, windowHours = 24, actorId = null, correlationId = null) {
  if (![24, 72, 168].includes(Number(windowHours))) throw createHttpError(400, 'Analytics window must be 24, 72, or 168 hours');
  const publication = await prisma.aiPublication.findUnique({ where: { id: publicationId } });
  if (!publication || publication.state !== 'PUBLISHED') throw createHttpError(409, 'Analytics requires a published item');
  let provider = new MockAnalyticsProvider();
  if (publication.publisher === 'meta') {
    const connection = await prisma.aiMetaConnection.findFirst({ where: { pageId: publication.pageId, disconnectedAt: null } });
    if (!connection) throw createHttpError(401, 'Meta Page is disconnected');
    provider = new MetaAnalyticsProvider({ graphVersion: env.META_GRAPH_VERSION, accessToken: decryptMetaToken(connection, { encodedKey: env.META_TOKEN_ENCRYPTION_KEY }) });
  }
  const values = await provider.fetch(publication, Number(windowHours));
  const snapshot = await prisma.aiAnalyticsSnapshot.upsert({
    where: { publicationId_windowHours: { publicationId, windowHours: Number(windowHours) } },
    create: { publicationId, windowHours: Number(windowHours), reach: values.reach, impressions: values.impressions, reactions: values.reactions, comments: values.comments, shares: values.shares, linkClicks: values.linkClicks, videoViews: values.videoViews, isMock: Boolean(values.mock) },
    update: { reach: values.reach, impressions: values.impressions, reactions: values.reactions, comments: values.comments, shares: values.shares, linkClicks: values.linkClicks, videoViews: values.videoViews, isMock: Boolean(values.mock), capturedAt: new Date() },
  });
  await audit(actorId, 'FETCH_ANALYTICS', 'publication', publicationId, { windowHours, mock: values.mock }, correlationId);
  return { ...snapshot, rates: { engagementRate: values.engagementRate, clickRate: values.clickRate } };
}

export async function analyticsOverview() {
  const snapshots = await prisma.aiAnalyticsSnapshot.findMany({ include: { publication: { include: { draft: { include: { idea: true } } } } }, orderBy: { capturedAt: 'desc' }, take: 100 });
  const latestByPublication = new Map();
  for (const item of snapshots) { const current = latestByPublication.get(item.publicationId); if (!current || item.windowHours > current.windowHours) latestByPublication.set(item.publicationId, item); }
  const totals = [...latestByPublication.values()].reduce((sum, item) => ({ reach: sum.reach + item.reach, impressions: sum.impressions + item.impressions, reactions: sum.reactions + item.reactions, comments: sum.comments + item.comments, shares: sum.shares + item.shares, linkClicks: sum.linkClicks + item.linkClicks, videoViews: sum.videoViews + item.videoViews }), { reach: 0, impressions: 0, reactions: 0, comments: 0, shares: 0, linkClicks: 0, videoViews: 0 });
  const groups = new Map();
  for (const item of snapshots) {
    const idea = item.publication.draft.idea;
    const key = `${idea?.contentPillar || 'UNKNOWN'}:${idea?.outputType || 'UNKNOWN'}:${item.windowHours}`;
    const group = groups.get(key) || { contentPillar: idea?.contentPillar || 'UNKNOWN', outputType: idea?.outputType || 'UNKNOWN', windowHours: item.windowHours, posts: 0, reach: 0, interactions: 0 };
    group.posts += 1; group.reach += item.reach; group.interactions += item.reactions + item.comments + item.shares; groups.set(key, group);
  }
  const insights = [...groups.values()].map((group) => ({ ...group, engagementRate: group.interactions / Math.max(group.reach, 1) })).sort((a, b) => b.engagementRate - a.engagementRate);
  return { totals, insights, snapshots };
}

export async function sendDailyNotification(correlationId = null) {
  const ideas = await prisma.aiContentIdea.count({ where: { createdAt: { gte: startOfTodayUtc() }, status: { not: 'ARCHIVED' } } });
  return notifications.send({ type: 'DAILY_IDEAS_READY', entityId: null, message: `${ideas} daily content ideas are ready for review`, details: { count: ideas, correlationId } });
}

export async function cleanupTemporaryFiles(correlationId = null, maxAgeHours = 24) {
  const tempDir = path.resolve(env.AI_CONTENT_MEDIA_ROOT, 'temp');
  const root = path.resolve(env.AI_CONTENT_MEDIA_ROOT);
  if (tempDir !== path.join(root, 'temp')) throw new Error('Unsafe temp cleanup path');
  await fs.mkdir(tempDir, { recursive: true });
  const cutoff = Date.now() - maxAgeHours * 3_600_000;
  let removed = 0;
  for (const entry of await fs.readdir(tempDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const target = path.join(tempDir, entry.name);
    const stat = await fs.stat(target);
    if (stat.mtimeMs < cutoff) { await fs.rm(target, { force: true }); removed += 1; }
  }
  await audit(null, 'CLEAN_TEMP_FILES', 'system', null, { removed, maxAgeHours }, correlationId);
  return { removed, maxAgeHours };
}

export async function selectIdea(id, actorId, correlationId) {
  const idea = await prisma.aiContentIdea.findUnique({ where: { id } });
  if (!idea) throw createHttpError(404, 'Content idea not found');
  assertTransition(idea.status, 'AWAITING_MEDIA');
  const updated = await prisma.aiContentIdea.update({ where: { id }, data: { status: 'AWAITING_MEDIA', selectedAt: new Date() }, include: { shotItems: true } });
  await audit(actorId, 'SELECT_IDEA', 'idea', id, null, correlationId);
  return updated;
}

export async function recordIdeaFeedback(id, { action, feedback }, actorId, correlationId) {
  const idea = await prisma.aiContentIdea.findUnique({ where: { id } });
  if (!idea) throw createHttpError(404, 'Content idea not found');
  const updated = await prisma.aiContentIdea.update({ where: { id }, data: { status: ['NOT_RELEVANT', 'SKIP_TODAY'].includes(action) ? 'ARCHIVED' : idea.status, feedback: feedback || action } });
  await audit(actorId, 'CONTENT_IDEA_FEEDBACK', 'idea', id, { action, feedback: feedback || null }, correlationId);
  return updated;
}

export async function saveUploads(files, { actorId, correlationId } = {}) {
  if (!files?.length) throw createHttpError(400, 'At least one media file is required');
  if (files.reduce((sum, file) => sum + file.size, 0) > 150 * 1024 * 1024) {
    await Promise.all(files.map((file) => fs.rm(file.path, { force: true })));
    throw createHttpError(413, 'Total upload size exceeds 150 MB');
  }
  await mediaStorage.ensure();
  const results = [];
  for (const file of files) {
    const handle = await fs.open(file.path, 'r');
    const header = Buffer.alloc(32);
    await handle.read(header, 0, header.length, 0); await handle.close();
    const actualMime = detectMime(header);
    if (!actualMime || !['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'].includes(actualMime)) { await fs.rm(file.path, { force: true }); throw createHttpError(415, `Unsupported media content: ${file.originalname}`); }
    const digest = await sha256File(file.path);
    const duplicate = await prisma.mediaAsset.findUnique({ where: { sha256: digest } });
    if (duplicate && !duplicate.deletedAt) { await fs.rm(file.path, { force: true }); results.push({ ...jsonSafeMedia(duplicate), duplicate: true }); continue; }
    const safeFilename = safeStoredFilename(file.originalname, actualMime);
    const storageKey = await mediaStorage.adopt('originals', safeFilename, file.path);
    let analysis = {}; let perceptualHash = null; let samplePath = null;
    try {
      const storedPath = mediaStorage.pathFor(storageKey);
      if (actualMime.startsWith('image/')) {
        analysis = await imageRenderer.analyze(storedPath); perceptualHash = await imageRenderer.perceptualHash(storedPath);
      } else {
        analysis = await videoRenderer.analyze(storedPath);
        samplePath = `${storedPath}.sample.jpg`;
        await videoRenderer.extractSampleFrame({ input: storedPath, output: samplePath });
        const visual = await imageRenderer.analyze(samplePath);
        analysis = { ...analysis, exposureScore: visual.exposureScore, blurScore: visual.blurScore };
        perceptualHash = await imageRenderer.perceptualHash(samplePath);
      }
    } catch (error) { await mediaStorage.remove(storageKey); throw createHttpError(422, `Invalid or damaged media: ${file.originalname}`, safeError(error)); }
    finally { if (samplePath) await fs.rm(samplePath, { force: true }); }
    const dimensionsPass = (analysis.width || 0) >= (actualMime.startsWith('video/') ? 540 : 720) && (analysis.height || 0) >= (actualMime.startsWith('video/') ? 540 : 720);
    const exposurePass = analysis.exposureScore >= env.AI_CONTENT_IMAGE_MIN_EXPOSURE && analysis.exposureScore <= env.AI_CONTENT_IMAGE_MAX_EXPOSURE;
    const sharpnessPass = analysis.blurScore == null || analysis.blurScore >= env.AI_CONTENT_IMAGE_MIN_SHARPNESS;
    const privacy = await privacyAnalyzer.analyze(mediaStorage.pathFor(storageKey));
    const visualDuplicate = perceptualHash ? await prisma.mediaAsset.findFirst({ where: { perceptualHash, deletedAt: null }, select: { id: true } }) : null;
    const privacyFlags = [...new Set(['PRIVACY_REVIEW_REQUIRED', ...privacy.flags, ...(visualDuplicate ? ['POSSIBLE_VISUAL_DUPLICATE'] : [])])];
    const qualityStatus = dimensionsPass && exposurePass && sharpnessPass ? 'BLOCKED_FOR_REVIEW' : 'REJECTED';
    const created = await prisma.mediaAsset.create({ data: {
      url: '/api/admin/ai-content/uploads/pending/file', type: actualMime.startsWith('image/') ? 'IMAGE' : 'VIDEO', source: 'UPLOAD', originalFilename: String(file.originalname).slice(0, 255), safeFilename, detectedMime: actualMime, sha256: digest,
      width: analysis.width, height: analysis.height, orientation: analysis.orientation != null ? String(analysis.orientation) : (analysis.rotation != null ? String(analysis.rotation) : null), fileSizeBytes: BigInt(file.size), storageKey, perceptualHash,
      durationSeconds: analysis.durationSeconds, audioScore: analysis.hasAudio === false ? 0 : (analysis.hasAudio ? 100 : null),
      blurScore: analysis.blurScore, exposureScore: analysis.exposureScore, faceCount: privacy.faceCount, privacyFlags, consentStatus: 'UNKNOWN', qualityStatus,
      rejectionReason: dimensionsPass ? (!exposurePass ? 'Ảnh quá tối hoặc quá sáng; vui lòng chụp lại.' : (!sharpnessPass ? 'Ảnh có dấu hiệu mất nét; vui lòng chụp lại.' : null)) : 'Độ phân giải quá thấp; vui lòng quay/chụp lại rõ hơn.',
    } });
    await prisma.mediaAsset.update({ where: { id: created.id }, data: { url: `/api/admin/ai-content/uploads/${created.id}/file` } });
    await audit(actorId, 'UPLOAD_MEDIA', 'media', created.id, { mime: actualMime, size: file.size, qualityStatus }, correlationId);
    results.push(jsonSafeMedia({ ...created, url: `/api/admin/ai-content/uploads/${created.id}/file` }));
  }
  return results;
}

export async function getUpload(id) {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media || media.deletedAt) throw createHttpError(404, 'Media not found');
  return jsonSafeMedia(media);
}

export async function getUploadFile(id) {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media || media.deletedAt || !media.storageKey) throw createHttpError(404, 'Media file not found');
  return { path: mediaStorage.pathFor(media.storageKey), mime: media.detectedMime, filename: media.safeFilename };
}

export async function reviewUpload(id, { approved, consentStatus, note }, actorId, correlationId) {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media || media.deletedAt) throw createHttpError(404, 'Media not found');
  if (media.qualityStatus === 'READY') {
    if (approved) return { ...jsonSafeMedia(media), automation: { status: 'ALREADY_REVIEWED' } };
    throw createHttpError(409, 'Approved media requires an explicit consent revocation workflow before rejection');
  }
  if (media.qualityStatus === 'REJECTED' && approved) throw createHttpError(409, 'Rejected media must be replaced, not manually approved');
  if (approved && !['GRANTED', 'NOT_REQUIRED'].includes(consentStatus)) throw createHttpError(400, 'Approved media requires granted consent or confirmation that consent is not required');
  const detectedSensitiveFlags = (media.privacyFlags || []).filter((flag) => ['FACE_DETECTED', 'POSSIBLE_LICENSE_PLATE', 'QR_CODE_DETECTED'].includes(flag));
  if (approved && detectedSensitiveFlags.length && consentStatus !== 'GRANTED') throw createHttpError(409, `Detected privacy flags require explicit consent evidence: ${detectedSensitiveFlags.join(', ')}`);
  const updated = await prisma.$transaction(async (tx) => {
    const reviewedTags = [...new Set([...(Array.isArray(media.tags) ? media.tags : []), ...detectedSensitiveFlags.map((flag) => `REVIEWED_${flag}`)])];
    const asset = await tx.mediaAsset.update({ where: { id }, data: { qualityStatus: approved ? 'READY' : 'REJECTED', consentStatus, privacyFlags: approved ? [] : ['PRIVACY_REVIEW_REJECTED'], tags: reviewedTags, rejectionReason: approved ? null : (note || 'Không đạt kiểm tra quyền riêng tư') } });
    await tx.aiConsentRecord.create({ data: { mediaAssetId: id, status: consentStatus, scope: approved ? 'SOCIAL_CONTENT_APPROVED' : 'SOCIAL_CONTENT_DENIED', evidenceRef: note || null, grantedAt: approved ? new Date() : null, createdById: actorId } });
    return asset;
  });
  await audit(actorId, approved ? 'APPROVE_MEDIA_PRIVACY' : 'REJECT_MEDIA_PRIVACY', 'media', id, { consentStatus, note: note || null, reviewedPrivacyFlags: detectedSensitiveFlags }, correlationId);
  let automation = null;
  if (approved) {
    const profile = await ensureBusinessProfile();
    if (profile.autonomyMode === 'AUTO_AFTER_UPLOAD') {
      const idea = await prisma.aiContentIdea.findFirst({ where: { status: 'AWAITING_MEDIA', allowedMode: { not: 'REVIEW_REQUIRED' } }, orderBy: [{ selectedAt: 'desc' }, { priority: 'desc' }] });
      if (idea) automation = await runAutomaticWorkflow({ idea, media: [updated], actorId, correlationId, trigger: 'approved-upload' });
    }
  }
  return { ...jsonSafeMedia(updated), automation };
}

export async function deleteUpload(id, actorId, correlationId) {
  const media = await prisma.mediaAsset.findUnique({ where: { id }, include: { contentAssets: true } });
  if (!media || media.deletedAt) throw createHttpError(404, 'Media not found');
  if (media.contentAssets.length) throw createHttpError(409, 'Media is used by a draft; archive the draft first');
  await prisma.mediaAsset.update({ where: { id }, data: { deletedAt: new Date(), qualityStatus: 'DELETED' } });
  if (media.storageKey) await mediaStorage.remove(media.storageKey);
  await audit(actorId, 'DELETE_MEDIA', 'media', id, null, correlationId);
  return { id, deleted: true };
}

export async function generateDraft({ ideaId, mediaAssetIds = [] }, actorId, correlationId) {
  const [idea, profile, media] = await Promise.all([
    prisma.aiContentIdea.findUnique({ where: { id: ideaId } }), ensureBusinessProfile(),
    prisma.mediaAsset.findMany({ where: { id: { in: mediaAssetIds }, deletedAt: null } }),
  ]);
  if (!idea) throw createHttpError(404, 'Content idea not found');
  if (!media.length || media.length !== new Set(mediaAssetIds).size) throw createHttpError(400, 'Select valid media before generating a draft');
  if (media.some((asset) => asset.qualityStatus !== 'READY')) throw createHttpError(409, 'Every media asset must pass quality and privacy review');
  let caption;
  try { caption = parseCaption(await llmProvider.generateCaption({ idea, profile })); }
  catch { caption = parseCaption(await templateProvider.generateCaption({ idea, profile })); }
  assertFacts({ caption: `${caption.caption_vi}\n${caption.caption_en}`, verifiedFacts: profile.verifiedFacts, allowedClaims: profile.allowedCtas, factsUsed: caption.facts_used });
  const draft = await prisma.aiContentDraft.create({ data: {
    ideaId, state: profile.autonomyMode === 'REVIEW_REQUIRED' ? 'AWAITING_APPROVAL' : 'DRAFT_READY', headline: String(caption.headline), captionVi: String(caption.caption_vi), captionEn: String(caption.caption_en), captionKo: caption.caption_ko_optional || null,
    shortCaption: String(caption.short_caption), cta: String(caption.cta), hashtags: caption.hashtags, altText: String(caption.alt_text), factsUsed: caption.facts_used, sourceIds: caption.source_ids || [], riskFlags: caption.risk_flags, confidence: Number(caption.confidence), recommendedPublishAt: caption.recommended_publish_time ? new Date(caption.recommended_publish_time) : null,
    assets: { create: media.map((asset, index) => ({ mediaAssetId: asset.id, role: index === 0 ? 'PRIMARY' : 'SECONDARY', sortOrder: index })) },
  }, include: { assets: { include: { mediaAsset: true } }, idea: true } });
  await audit(actorId, 'GENERATE_DRAFT', 'draft', draft.id, { provider: caption.provider }, correlationId);
  return draftDto(draft);
}

export async function getDraft(id) {
  const draft = await prisma.aiContentDraft.findUnique({ where: { id }, include: { idea: true, assets: { include: { mediaAsset: true } }, publications: true } });
  if (!draft) throw createHttpError(404, 'Draft not found');
  return draftDto(draft);
}

export async function updateDraft(id, changes, actorId, correlationId) {
  const draft = await prisma.aiContentDraft.findUnique({ where: { id } });
  if (!draft) throw createHttpError(404, 'Draft not found');
  if (!['DRAFT_READY', 'AWAITING_APPROVAL'].includes(draft.state)) throw createHttpError(409, 'Draft cannot be edited in its current state');
  const profile = await ensureBusinessProfile();
  assertFacts({
    caption: `${changes.captionVi ?? draft.captionVi}\n${changes.captionEn ?? draft.captionEn}`,
    verifiedFacts: profile.verifiedFacts,
    allowedClaims: profile.allowedCtas,
    factsUsed: draft.factsUsed,
  });
  const updated = await prisma.aiContentDraft.update({ where: { id }, data: { ...changes, version: { increment: 1 }, state: 'AWAITING_APPROVAL' } });
  await audit(actorId, 'UPDATE_DRAFT', 'draft', id, { fields: Object.keys(changes) }, correlationId);
  return updated;
}

export async function renderDraft(id, actorId, correlationId) {
  const draft = await prisma.aiContentDraft.findUnique({ where: { id }, include: { assets: { include: { mediaAsset: true }, orderBy: { sortOrder: 'asc' } } } });
  if (!draft) throw createHttpError(404, 'Draft not found');
  const primary = draft.assets.find((asset) => asset.role === 'PRIMARY') || draft.assets[0];
  if (!primary?.mediaAsset?.storageKey || primary.mediaAsset.qualityStatus !== 'READY') throw createHttpError(409, 'A reviewed primary media asset is required');
  await mediaStorage.ensure();
  const isVideo = primary.mediaAsset.type === 'VIDEO';
  const filename = `${crypto.randomUUID()}${isVideo ? '.mp4' : '.jpg'}`;
  const outputKey = `renders/${filename}`;
  const outputPath = mediaStorage.pathFor(outputKey);
  const inputPath = mediaStorage.pathFor(primary.mediaAsset.storageKey);
  if (isVideo) await videoRenderer.renderReel({ input: inputPath, output: outputPath });
  else await imageRenderer.renderSocial({ input: inputPath, output: outputPath });
  const stat = await fs.stat(outputPath);
  const digest = await sha256File(outputPath);
  const rendered = await prisma.mediaAsset.create({ data: {
    url: '/api/admin/ai-content/uploads/pending/file', type: isVideo ? 'VIDEO' : 'IMAGE', source: 'UPLOAD', originalFilename: filename, safeFilename: filename,
    detectedMime: isVideo ? 'video/mp4' : 'image/jpeg', sha256: digest, width: 1080, height: isVideo ? 1920 : 1350, fileSizeBytes: BigInt(stat.size), storageKey: outputKey,
    privacyFlags: [], consentStatus: primary.mediaAsset.consentStatus, qualityStatus: 'READY', tags: ['AI_CONTENT_RENDER'],
  } });
  const linked = await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.update({ where: { id: rendered.id }, data: { url: `/api/admin/ai-content/uploads/${rendered.id}/file` } });
    return tx.aiContentAsset.create({ data: { draftId: id, mediaAssetId: rendered.id, role: 'RENDERED_FINAL', sortOrder: 999, renderMeta: { renderer: isVideo ? 'ffmpeg' : 'sharp', width: 1080, height: isVideo ? 1920 : 1350, sourceMediaId: primary.mediaAssetId } }, include: { mediaAsset: true } });
  });
  await audit(actorId, 'RENDER_DRAFT', 'draft', id, { mediaAssetId: rendered.id, renderer: isVideo ? 'ffmpeg' : 'sharp' }, correlationId);
  return { ...linked, mediaAsset: jsonSafeMedia(linked.mediaAsset) };
}

export async function approveDraft(id, actorId, correlationId) {
  const draft = await prisma.aiContentDraft.findUnique({ where: { id } });
  if (!draft) throw createHttpError(404, 'Draft not found');
  { const profile = await ensureBusinessProfile(); assertFacts({ caption: `${draft.captionVi}\n${draft.captionEn}`, verifiedFacts: profile.verifiedFacts, allowedClaims: profile.allowedCtas, factsUsed: draft.factsUsed }); }
  if (!['DRAFT_READY', 'AWAITING_APPROVAL'].includes(draft.state)) throw createHttpError(409, 'Draft is not awaiting approval');
  const updated = await prisma.aiContentDraft.update({ where: { id }, data: { state: 'APPROVED', approvedAt: new Date(), approvedById: actorId } });
  await audit(actorId, 'APPROVE_DRAFT', 'draft', id, null, correlationId);
  return updated;
}

export async function scheduleDraft(id, scheduledAt, actorId, correlationId) {
  const draft = await prisma.aiContentDraft.findUnique({ where: { id }, include: { assets: true } });
  if (!draft) throw createHttpError(404, 'Draft not found');
  if (draft.state !== 'APPROVED') throw createHttpError(409, 'Only an approved draft can be scheduled');
  if (!draft.assets.some((asset) => asset.role === 'RENDERED_FINAL')) throw createHttpError(409, 'Render and review final media before scheduling');
  const profile = await ensureBusinessProfile();
  if (profile.emergencyStop) throw createHttpError(423, 'Emergency stop is active');
  const contentHash = publicationContentHash({ version: draft.version, captionVi: draft.captionVi, captionEn: draft.captionEn, mediaAssetIds: draft.assets.map((asset) => asset.mediaAssetId) });
  const key = crypto.createHash('sha256').update(`${id}:${draft.version}:${new Date(scheduledAt).toISOString()}`).digest('hex');
  const publisher = env.AI_CONTENT_LIVE_META_ENABLED ? 'meta' : 'mock';
  const publication = await prisma.$transaction(async (tx) => {
    const changed = await tx.aiContentDraft.updateMany({ where: { id, state: 'APPROVED', version: draft.version }, data: { state: 'SCHEDULED' } });
    if (changed.count !== 1) throw createHttpError(409, 'Draft was already scheduled or changed concurrently');
    const created = await tx.aiPublication.create({ data: { draftId: id, idempotencyKey: key, approvedVersion: draft.version, contentHash, state: 'SCHEDULED', scheduledAt: new Date(scheduledAt), publisher, pageId: env.META_PAGE_ID } });
    return created;
  });
  await audit(actorId, 'SCHEDULE_DRAFT', 'publication', publication.id, { scheduledAt, publisher: publication.publisher }, correlationId);
  await prisma.mediaAsset.updateMany({ where: { contentAssets: { some: { draftId: id, role: { in: ['PRIMARY', 'SECONDARY'] } } } }, data: { usageCount: { increment: 1 }, lastUsedAt: new Date() } });
  return publication;
}

async function runAutomaticWorkflow({ idea, media, actorId = null, correlationId = null, trigger }) {
  if (!idea || idea.allowedMode === 'REVIEW_REQUIRED') return { status: 'SKIPPED', reason: 'IDEA_REQUIRES_REVIEW' };
  if (!media.length || media.some((item) => item.qualityStatus !== 'READY' || !['GRANTED', 'NOT_REQUIRED'].includes(item.consentStatus))) return { status: 'SKIPPED', reason: 'MEDIA_NOT_APPROVED' };
  const recentPublications = await prisma.aiPublication.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) }, state: { not: 'ARCHIVED' } } });
  if (recentPublications >= env.AI_CONTENT_DAILY_PUBLISH_LIMIT) return { status: 'SKIPPED', reason: 'DAILY_FREQUENCY_LIMIT' };
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const reservationKey = `automatic:${idea.id}:${media.map((item) => item.id).sort().join(',')}:${dayKey}`;
  let reservation;
  try { reservation = await prisma.aiJob.create({ data: { type: 'AUTOMATION_RESERVATION', payload: { ideaId: idea.id, mediaAssetIds: media.map((item) => item.id), trigger }, state: 'SUCCEEDED', idempotencyKey: reservationKey, finishedAt: new Date(), maxAttempts: 1 } }); }
  catch (error) { if (error.code === 'P2002') return { status: 'SKIPPED', reason: 'AUTOMATION_ALREADY_RESERVED' }; throw error; }
  try {
    if (idea.status === 'IDEA_PROPOSED') await selectIdea(idea.id, actorId, correlationId);
    const draft = await generateDraft({ ideaId: idea.id, mediaAssetIds: media.map((item) => item.id) }, actorId, correlationId);
    if ((draft.riskFlags || []).length || Number(draft.confidence) < 0.75) return { status: 'AWAITING_APPROVAL', draftId: draft.id, reason: 'RISK_OR_CONFIDENCE_GATE' };
    await renderDraft(draft.id, actorId, correlationId);
    await approveDraft(draft.id, actorId, correlationId);
    const publication = await scheduleDraft(draft.id, new Date(Date.now() + 2 * 60_000), actorId, correlationId);
    await prisma.$transaction([
      prisma.aiContentIdea.update({ where: { id: idea.id }, data: { status: 'SCHEDULED' } }),
      prisma.aiJob.update({ where: { id: reservation.id }, data: { state: 'SUCCEEDED', finishedAt: new Date(), claimOwner: null, claimToken: null, leaseExpiresAt: null } }),
    ]);
    await audit(actorId, 'AUTOMATIC_WORKFLOW_SCHEDULED', 'publication', publication.id, { trigger, mode: (await ensureBusinessProfile()).autonomyMode }, correlationId);
    return { status: 'SCHEDULED', draftId: draft.id, publicationId: publication.id };
  } catch (error) {
    await prisma.aiJob.update({ where: { id: reservation.id }, data: { state: 'FAILED', finishedAt: new Date(), lastError: safeError(error).message, claimOwner: null, claimToken: null, leaseExpiresAt: null } });
    await audit(actorId, 'AUTOMATIC_WORKFLOW_PAUSED', 'idea', idea.id, { trigger, error: safeError(error).message }, correlationId);
    return { status: 'PAUSED', reason: safeError(error).message };
  }
}

export async function runFullAutoSafe(correlationId = null) {
  const profile = await ensureBusinessProfile();
  if (profile.autonomyMode !== 'FULL_AUTO_SAFE' || profile.emergencyStop) return { status: 'SKIPPED', reason: 'MODE_OR_STOP_GATE' };
  const ideas = await generateTodayIdeas(null, correlationId);
  const idea = ideas.find((item) => item.allowedMode === 'FULL_AUTO_SAFE' && ['IDEA_PROPOSED', 'AWAITING_MEDIA'].includes(item.status));
  if (!idea) return { status: 'SKIPPED', reason: 'NO_SAFE_IDEA' };
  const media = await prisma.mediaAsset.findFirst({ where: { type: 'IMAGE', qualityStatus: 'READY', deletedAt: null, consentStatus: { in: ['GRANTED', 'NOT_REQUIRED'] }, usageCount: { lt: 3 }, storageKey: { startsWith: 'originals/' } }, orderBy: [{ usageCount: 'asc' }, { lastUsedAt: 'asc' }, { createdAt: 'desc' }] });
  if (!media) return { status: 'SKIPPED', reason: 'NO_APPROVED_REUSABLE_MEDIA' };
  return runAutomaticWorkflow({ idea, media: [media], correlationId, trigger: 'full-auto-safe-daily' });
}

async function publisherFor(publication) {
  if (publication.publisher !== 'meta') return new MockPublisher();
  const connection = await prisma.aiMetaConnection.findFirst({ where: { pageId: publication.pageId, disconnectedAt: null } });
  if (!connection) throw Object.assign(new Error('Meta Page is not connected'), { status: 401 });
  const { decryptMetaToken } = await import('./security/tokenCrypto.js');
  return new MetaPagePublisher({ graphVersion: env.META_GRAPH_VERSION, pageId: connection.pageId, accessToken: decryptMetaToken(connection, { encodedKey: env.META_TOKEN_ENCRYPTION_KEY }), liveEnabled: env.AI_CONTENT_LIVE_META_ENABLED });
}

export async function publishPublication(id, actorId = null, correlationId = null) {
  const profile = await ensureBusinessProfile();
  if (profile.emergencyStop) throw createHttpError(423, 'Emergency stop is active');
  const due = await prisma.aiPublication.findUnique({ where: { id }, include: { draft: { include: { assets: { include: { mediaAsset: true } } } } } });
  if (!due) throw createHttpError(404, 'Publication not found');
  if (!due.scheduledAt || due.scheduledAt > new Date()) throw createHttpError(409, 'Publication is not due yet');
  if (due.draft.version !== due.approvedVersion) throw createHttpError(409, 'Draft changed after approval; approve and schedule a new version');
  if (due.draft.assets.some(({ mediaAsset }) => mediaAsset.deletedAt || mediaAsset.qualityStatus !== 'READY' || !['GRANTED', 'NOT_REQUIRED'].includes(mediaAsset.consentStatus))) throw createHttpError(409, 'Publication media no longer passes quality or privacy gates');
  assertFacts({ caption: `${due.draft.captionVi}\n${due.draft.captionEn}`, verifiedFacts: profile.verifiedFacts, allowedClaims: profile.allowedCtas, factsUsed: due.draft.factsUsed });
  const currentHash = publicationContentHash({ version: due.draft.version, captionVi: due.draft.captionVi, captionEn: due.draft.captionEn, mediaAssetIds: due.draft.assets.map((asset) => asset.mediaAssetId) });
  if (currentHash !== due.contentHash) throw createHttpError(409, 'Publication content does not match the approved snapshot');
  const claimOwner = crypto.randomUUID();
  const claimed = await prisma.aiPublication.updateMany({ where: { id, state: { in: ['SCHEDULED', 'PUBLISH_FAILED'] }, remotePostId: null }, data: { state: 'PUBLISHING', claimedAt: new Date(), claimOwner } });
  if (claimed.count !== 1) {
    const current = await prisma.aiPublication.findUnique({ where: { id } });
    if (!current) throw createHttpError(404, 'Publication not found');
    if (current.remotePostId || current.state === 'PUBLISHED') return current;
    throw createHttpError(409, 'Publication is already being processed or requires reconciliation');
  }
  const publication = await prisma.aiPublication.findUnique({ where: { id }, include: { draft: true, attempts: true } });
  const attemptNumber = publication.attempts.length + 1;
  const attempt = await prisma.aiPublicationAttempt.create({ data: { publicationId: id, attemptNumber, status: 'RUNNING' } });
  let dispatchStarted = false;
  try {
    const publisher = await publisherFor(publication);
    const finalProfile = await ensureBusinessProfile();
    if (finalProfile.emergencyStop) throw createHttpError(423, 'Emergency stop became active before dispatch');
    dispatchStarted = true;
    const finalAsset = due.draft.assets.find((asset) => asset.role === 'RENDERED_FINAL')?.mediaAsset;
    if (!finalAsset?.storageKey) throw createHttpError(409, 'Rendered final media is missing');
    const result = await publisher.publish({
      idempotencyKey: publication.idempotencyKey,
      caption: `${publication.draft.captionVi}\n\n${publication.draft.captionEn}`,
      media: {
        mime: finalAsset.detectedMime,
        filename: finalAsset.safeFilename,
        read: () => fs.readFile(mediaStorage.pathFor(finalAsset.storageKey)),
      },
    });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.aiPublicationAttempt.update({ where: { id: attempt.id }, data: { status: 'SUCCEEDED', remotePostId: result.remotePostId, finishedAt: new Date() } });
      await tx.aiContentDraft.update({ where: { id: publication.draftId }, data: { state: result.processing ? 'SCHEDULED' : 'PUBLISHED' } });
      if (!result.processing && publication.draft.ideaId) await tx.aiContentIdea.update({ where: { id: publication.draft.ideaId }, data: { status: 'PUBLISHED' } });
      return tx.aiPublication.update({ where: { id }, data: { state: result.processing ? 'PUBLISHING' : 'PUBLISHED', remotePostId: result.remotePostId, remotePermalink: result.permalink, publishedAt: result.processing ? null : new Date(), claimOwner: null } });
    });
    await audit(actorId, 'PUBLISH_CONTENT', 'publication', id, { dryRun: result.dryRun, remotePostId: result.remotePostId }, correlationId);
    return updated;
  } catch (error) {
    const provablyRejected = [400, 401, 403, 429].includes(Number(error.status));
    const unknown = publication.publisher === 'meta' && dispatchStarted && !provablyRejected;
    await prisma.$transaction([
      prisma.aiPublicationAttempt.update({ where: { id: attempt.id }, data: { status: unknown ? 'UNKNOWN' : 'FAILED', errorCategory: unknown ? 'AMBIGUOUS_TIMEOUT' : 'PUBLISH_ERROR', errorMessage: safeError(error).message, finishedAt: new Date() } }),
      prisma.aiPublication.update({ where: { id }, data: { state: unknown ? 'PUBLISH_UNKNOWN' : 'PUBLISH_FAILED', reconciliationDue: unknown, failureCode: error.code || String(error.status || 'UNKNOWN'), failureMessage: safeError(error).message, claimOwner: null } }),
    ]);
    error.retryable = !unknown && (Number(error.status) === 429 || Number(error.status) >= 500 || ['ECONNRESET', 'ETIMEDOUT'].includes(error.code));
    throw error;
  }
}

export async function resumePublication(id, scheduledAt, actorId, correlationId) {
  const profile = await ensureBusinessProfile();
  if (profile.emergencyStop) throw createHttpError(423, 'Emergency stop is active');
  const publication = await prisma.aiPublication.findUnique({ where: { id }, include: { draft: { include: { assets: { include: { mediaAsset: true } } } } } });
  if (!publication) throw createHttpError(404, 'Publication not found');
  if (publication.state !== 'PAUSED') throw createHttpError(409, 'Only a paused publication can be rescheduled');
  if (publication.draft.version !== publication.approvedVersion) throw createHttpError(409, 'Draft changed after approval');
  if (publication.draft.assets.some(({ mediaAsset }) => mediaAsset.deletedAt || mediaAsset.qualityStatus !== 'READY' || !['GRANTED', 'NOT_REQUIRED'].includes(mediaAsset.consentStatus))) throw createHttpError(409, 'Publication media no longer passes quality or privacy gates');
  assertFacts({ caption: `${publication.draft.captionVi}\n${publication.draft.captionEn}`, verifiedFacts: profile.verifiedFacts, allowedClaims: profile.allowedCtas, factsUsed: publication.draft.factsUsed });
  const currentHash = publicationContentHash({ version: publication.draft.version, captionVi: publication.draft.captionVi, captionEn: publication.draft.captionEn, mediaAssetIds: publication.draft.assets.map((asset) => asset.mediaAssetId) });
  if (currentHash !== publication.contentHash) throw createHttpError(409, 'Publication content does not match the approved snapshot');
  const changed = await prisma.aiPublication.updateMany({ where: { id, state: 'PAUSED' }, data: { state: 'SCHEDULED', scheduledAt: new Date(scheduledAt), failureCode: null, failureMessage: null } });
  if (changed.count !== 1) throw createHttpError(409, 'Publication state changed concurrently');
  await prisma.aiContentDraft.update({ where: { id: publication.draftId }, data: { state: 'SCHEDULED' } });
  await audit(actorId, 'RESCHEDULE_PAUSED_PUBLICATION', 'publication', id, { scheduledAt }, correlationId);
  return prisma.aiPublication.findUnique({ where: { id } });
}

export async function checkMetaProcessing(publicationId, correlationId = null) {
  const publication = await prisma.aiPublication.findUnique({ where: { id: publicationId }, include: { draft: true } });
  if (!publication || publication.publisher !== 'meta' || publication.state !== 'PUBLISHING' || !publication.remotePostId) return publication;
  const publisher = await publisherFor(publication);
  const status = await publisher.processingStatus(publication.remotePostId);
  if (!status.ready && !status.failed) return publication;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.aiContentDraft.update({ where: { id: publication.draftId }, data: { state: status.ready ? 'PUBLISHED' : 'SCHEDULED' } });
    if (status.ready && publication.draft.ideaId) await tx.aiContentIdea.update({ where: { id: publication.draft.ideaId }, data: { status: 'PUBLISHED' } });
    return tx.aiPublication.update({ where: { id: publication.id }, data: { state: status.ready ? 'PUBLISHED' : 'PUBLISH_FAILED', publishedAt: status.ready ? new Date() : null, remotePostId: status.failed ? null : publication.remotePostId, remotePermalink: status.permalink, failureCode: status.failed ? 'META_PROCESSING_FAILED' : null, failureMessage: status.failed ? `Meta processing status: ${status.rawStatus}` : null } });
  });
  await audit(null, status.ready ? 'META_PROCESSING_COMPLETE' : 'META_PROCESSING_FAILED', 'publication', publication.id, { status: status.rawStatus }, correlationId);
  return updated;
}

export async function reconcilePublications(correlationId = null) {
  const unknown = await prisma.aiPublication.findMany({ where: { state: 'PUBLISH_UNKNOWN', publisher: 'meta', reconciliationDue: true }, include: { draft: true }, take: 20 });
  const results = [];
  for (const publication of unknown) {
    try {
      const publisher = await publisherFor(publication);
      const caption = `${publication.draft.captionVi}\n\n${publication.draft.captionEn}`;
      const matches = await publisher.findRecentExactCaption({ caption, since: new Date((publication.scheduledAt || publication.createdAt).getTime() - 5 * 60_000) });
      if (matches.length === 1) {
        const match = matches[0];
        const updated = await prisma.$transaction(async (tx) => {
          await tx.aiContentDraft.update({ where: { id: publication.draftId }, data: { state: 'PUBLISHED' } });
          if (publication.draft.ideaId) await tx.aiContentIdea.update({ where: { id: publication.draft.ideaId }, data: { status: 'PUBLISHED' } });
          return tx.aiPublication.update({ where: { id: publication.id }, data: { state: 'PUBLISHED', remotePostId: match.id, remotePermalink: match.permalink_url || null, publishedAt: new Date(match.created_time), reconciliationDue: false, failureCode: null, failureMessage: null } });
        });
        results.push({ id: updated.id, reconciled: true });
      } else if (matches.length === 0 && Date.now() - (publication.scheduledAt || publication.createdAt).getTime() > 30 * 60_000) {
        await prisma.aiPublication.update({ where: { id: publication.id }, data: { state: 'PUBLISH_FAILED', reconciliationDue: false, failureCode: 'RECONCILED_NO_REMOTE_MATCH', failureMessage: 'No exact Page post match was found after the reconciliation window', remotePostId: null } });
        results.push({ id: publication.id, reconciled: true, outcome: 'SAFE_TO_RETRY' });
      } else results.push({ id: publication.id, reconciled: false, matchCount: matches.length });
    } catch (error) { results.push({ id: publication.id, reconciled: false, error: safeError(error).message }); }
  }
  await audit(null, 'RECONCILE_PUBLICATIONS', 'publication', null, { results }, correlationId);
  return results;
}

export async function emergencyStop(active, actorId, correlationId) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.aiBusinessProfile.upsert({ where: { id: 'lune' }, create: { ...profileSeed, emergencyStop: active }, update: { emergencyStop: active } });
    if (active) {
      await tx.aiPublication.updateMany({ where: { state: 'SCHEDULED' }, data: { state: 'PAUSED' } });
      await tx.aiJob.updateMany({ where: { state: 'PENDING' }, data: { state: 'CANCELLED', finishedAt: new Date(), lastError: 'Emergency stop' } });
    } else {
      await tx.aiJob.updateMany({ where: { state: 'CANCELLED', type: { not: 'PUBLISH_CONTENT' }, lastError: 'Emergency stop', createdAt: { gte: new Date(Date.now() - 2 * 86_400_000) } }, data: { state: 'PENDING', scheduledAt: new Date(), finishedAt: null, lastError: null } });
    }
    await tx.aiAuditLog.create({ data: { actorId, action: active ? 'EMERGENCY_STOP_ACTIVATED' : 'EMERGENCY_STOP_RELEASED', entityType: 'system', correlationId } });
    return profile;
  });
}

export async function diagnostics() {
  const [dashboard, database] = await Promise.all([getDashboard(), prisma.$queryRaw`SELECT 1 AS ok`]);
  return { appVersion: process.env.npm_package_version || '1.0.0', database: Boolean(database), platform: os.platform(), architecture: os.arch(), totalMemoryBytes: os.totalmem(), freeMemoryBytes: os.freemem(), mediaRoot: path.basename(path.resolve(env.AI_CONTENT_MEDIA_ROOT)), ...dashboard.diagnostics };
}

export async function metaStatus() {
  const connection = await prisma.aiMetaConnection.findFirst({ where: { pageId: env.META_PAGE_ID, disconnectedAt: null } });
  return {
    connected: Boolean(connection), pageId: connection?.pageId || env.META_PAGE_ID,
    pageName: connection?.pageName || null, grantedScopes: connection?.grantedScopes || [],
    tokenExpiresAt: connection?.tokenExpiresAt || null, lastHealthCheckAt: connection?.lastHealthCheckAt || null,
    token: connection ? '***configured***' : null, liveEnabled: env.AI_CONTENT_LIVE_META_ENABLED,
    graphVersion: env.META_GRAPH_VERSION || null,
  };
}

export async function checkMetaTokenHealth(correlationId = null) {
  const connection = await prisma.aiMetaConnection.findFirst({ where: { pageId: env.META_PAGE_ID, disconnectedAt: null } });
  if (!connection) return { connected: false, healthy: false, reason: 'NOT_CONNECTED' };
  if (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date()) {
    await prisma.aiPublication.updateMany({ where: { pageId: connection.pageId, publisher: 'meta', state: 'SCHEDULED' }, data: { state: 'PAUSED', failureCode: 'META_TOKEN_EXPIRED', failureMessage: 'Meta token has expired' } });
    return { connected: true, healthy: false, reason: 'TOKEN_EXPIRED' };
  }
  const token = decryptMetaToken(connection, { encodedKey: env.META_TOKEN_ENCRYPTION_KEY });
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${connection.pageId}`);
  url.searchParams.set('fields', 'id,name');
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.id !== connection.pageId) {
    if ([401, 403].includes(response.status)) await prisma.aiPublication.updateMany({ where: { pageId: connection.pageId, publisher: 'meta', state: 'SCHEDULED' }, data: { state: 'PAUSED', failureCode: 'META_TOKEN_UNHEALTHY', failureMessage: 'Meta token health check failed' } });
    await audit(null, 'META_TOKEN_HEALTH_FAILED', 'meta_connection', connection.id, { status: response.status }, correlationId);
    return { connected: true, healthy: false, status: response.status };
  }
  await prisma.aiMetaConnection.update({ where: { id: connection.id }, data: { lastHealthCheckAt: new Date(), pageName: payload.name || connection.pageName } });
  await audit(null, 'META_TOKEN_HEALTH_OK', 'meta_connection', connection.id, { pageId: connection.pageId }, correlationId);
  return { connected: true, healthy: true, pageId: connection.pageId, pageName: payload.name || connection.pageName };
}

export async function createMetaConnectUrl(actorId, correlationId = null) {
  if (!env.META_APP_ID || !env.META_OAUTH_REDIRECT_URI || !env.META_GRAPH_VERSION) throw createHttpError(503, 'Meta OAuth environment is incomplete');
  const state = crypto.randomBytes(32).toString('base64url');
  const stateHash = crypto.createHash('sha256').update(state).digest('hex');
  await prisma.aiMetaOAuthState.create({ data: { stateHash, adminId: actorId, redirectUri: env.META_OAUTH_REDIRECT_URI, expiresAt: new Date(Date.now() + 10 * 60_000) } });
  await audit(actorId, 'START_META_OAUTH', 'meta_oauth_state', null, { expiresInSeconds: 600 }, correlationId);
  const url = new URL(`https://www.facebook.com/${env.META_GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set('client_id', env.META_APP_ID);
  url.searchParams.set('redirect_uri', env.META_OAUTH_REDIRECT_URI);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'pages_show_list,pages_manage_posts,pages_read_engagement,read_insights');
  return { url: url.toString(), expiresInSeconds: 600 };
}

export async function completeMetaOauth({ code, state }, actorId, correlationId) {
  if (!env.META_APP_ID || !env.META_APP_SECRET || !env.META_OAUTH_REDIRECT_URI || !env.META_TOKEN_ENCRYPTION_KEY || !env.META_GRAPH_VERSION) throw createHttpError(503, 'Meta OAuth environment is incomplete');
  const stateHash = crypto.createHash('sha256').update(state).digest('hex');
  const stored = await prisma.aiMetaOAuthState.findUnique({ where: { stateHash } });
  if (!stored || stored.adminId !== actorId || stored.consumedAt || stored.expiresAt <= new Date() || stored.redirectUri !== env.META_OAUTH_REDIRECT_URI) throw createHttpError(400, 'Invalid or expired Meta OAuth state');
  const consumed = await prisma.aiMetaOAuthState.updateMany({ where: { id: stored.id, adminId: actorId, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
  if (consumed.count !== 1) throw createHttpError(400, 'Meta OAuth state was already consumed');
  const tokenUrl = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', env.META_APP_ID); tokenUrl.searchParams.set('client_secret', env.META_APP_SECRET);
  tokenUrl.searchParams.set('redirect_uri', env.META_OAUTH_REDIRECT_URI); tokenUrl.searchParams.set('code', code);
  const tokenResponse = await fetch(tokenUrl, { signal: AbortSignal.timeout(15_000) });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.access_token) throw createHttpError(502, 'Meta token exchange failed');
  const longTokenUrl = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/oauth/access_token`);
  longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token'); longTokenUrl.searchParams.set('client_id', env.META_APP_ID); longTokenUrl.searchParams.set('client_secret', env.META_APP_SECRET); longTokenUrl.searchParams.set('fb_exchange_token', tokenPayload.access_token);
  const longTokenResponse = await fetch(longTokenUrl, { signal: AbortSignal.timeout(15_000) });
  const longTokenPayload = await longTokenResponse.json().catch(() => ({}));
  if (!longTokenResponse.ok || !longTokenPayload.access_token) throw createHttpError(502, 'Meta long-lived token exchange failed');
  const userAccessToken = longTokenPayload.access_token;
  const pagesResponse = await fetch(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/me/accounts?fields=id,name,access_token,tasks&limit=100`, { headers: { authorization: `Bearer ${userAccessToken}` }, signal: AbortSignal.timeout(15_000) });
  const pagesPayload = await pagesResponse.json().catch(() => ({}));
  if (!pagesResponse.ok) throw createHttpError(502, 'Meta Page enumeration failed');
  const permissionsResponse = await fetch(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/me/permissions`, { headers: { authorization: `Bearer ${userAccessToken}` }, signal: AbortSignal.timeout(15_000) });
  const permissionsPayload = await permissionsResponse.json().catch(() => ({}));
  if (!permissionsResponse.ok) throw createHttpError(502, 'Meta permission verification failed');
  const grantedScopes = (permissionsPayload.data || []).filter((item) => item.status === 'granted').map((item) => item.permission);
  const requiredScopes = ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement', 'read_insights'];
  const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
  if (missingScopes.length) throw createHttpError(403, `Meta authorization is missing required scopes: ${missingScopes.join(', ')}`);
  const page = pagesPayload.data?.find((candidate) => candidate.id === env.META_PAGE_ID);
  if (!page?.access_token) throw createHttpError(403, `Authorized account does not manage expected Page ${env.META_PAGE_ID}`);
  if (!page.tasks?.includes('CREATE_CONTENT')) throw createHttpError(403, 'Authorized account does not have CREATE_CONTENT task for the expected Page');
  const encrypted = encryptMetaToken(page.access_token, { encodedKey: env.META_TOKEN_ENCRYPTION_KEY, keyVersion: env.META_TOKEN_KEY_VERSION, pageId: page.id });
  const tokenExpiresAt = longTokenPayload.expires_in ? new Date(Date.now() + longTokenPayload.expires_in * 1000) : null;
  const connection = await prisma.aiMetaConnection.upsert({ where: { pageId: page.id }, create: { pageId: page.id, pageName: page.name, ...encrypted, grantedScopes, connectedById: actorId, tokenExpiresAt }, update: { pageName: page.name, ...encrypted, grantedScopes, connectedById: actorId, tokenExpiresAt, connectedAt: new Date(), disconnectedAt: null } });
  await audit(actorId, 'CONNECT_META_PAGE', 'meta_connection', connection.id, { pageId: page.id, pageName: page.name }, correlationId);
  return metaStatus();
}

export async function disconnectMeta(actorId, correlationId) {
  const connection = await prisma.aiMetaConnection.findFirst({ where: { pageId: env.META_PAGE_ID, disconnectedAt: null } });
  if (!connection) return { connected: false };
  await prisma.$transaction([
    prisma.aiMetaConnection.update({ where: { id: connection.id }, data: { disconnectedAt: new Date(), tokenCiphertext: '', tokenIv: '', tokenAuthTag: '' } }),
    prisma.aiPublication.updateMany({ where: { pageId: connection.pageId, publisher: 'meta', state: 'SCHEDULED' }, data: { state: 'PAUSED', failureCode: 'META_DISCONNECTED', failureMessage: 'Meta connection was disconnected' } }),
  ]);
  await audit(actorId, 'DISCONNECT_META_PAGE', 'meta_connection', connection.id, { pageId: connection.pageId }, correlationId);
  return { connected: false };
}

export const internals = { mediaStorage, imageRenderer, videoRenderer, llmProvider, templateProvider };

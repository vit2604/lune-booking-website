import assert from 'node:assert/strict';
import { test } from 'vitest';
import { calculateRates } from './analytics.js';
import { parseCaption } from './captionSchema.js';
import { inspectFacts } from './factGuard.js';
import { quotaDecision } from './quotaGuard.js';
import { classifyPublishError, retryDelayMs } from './retry.js';
import { assertTransition, canTransition } from './stateMachine.js';
import { normalizeTrendSignal, repetitionPenalty, scoreTrend } from './trendScoring.js';
import { detectMime, safeStoredFilename } from './uploadSecurity.js';
import { nextLocalSchedule } from './timezone.js';
import { decryptMetaToken, encryptMetaToken } from '../security/tokenCrypto.js';
import { publicationContentHash } from './contentHash.js';
import { isTerminalJobFailure } from '../adapters/databaseJobScheduler.js';
import { enrichOfficialTrend, parseOfficialFeed } from '../adapters/signalsAndAnalytics.js';

test('normalizes and scores verified trend signals', () => {
  const trend = normalizeTrendSignal({ source: ' Official ', title: '  Du lịch  Đà Nẵng ', keywords: ['Đà Nẵng', 'đà nẵng'] });
  assert.equal(trend.title, 'Du lịch Đà Nẵng');
  assert.deepEqual(trend.keywords, ['đà nẵng']);
  assert.equal(scoreTrend({ relevanceToLune: 100, locality: 100, recency: 100, verifiedGrowth: 100, growthIsVerified: false, sourceReliability: 100, audienceFit: 100, availableMediaFit: 100 }), 90);
});

test('applies repetition penalty', () => {
  assert.ok(repetitionPenalty({ title: 'Buổi sáng tại biển Mỹ Khê', recentTitles: ['Đón sáng tại biển Mỹ Khê'] }) > 0);
});

test('parses only bounded RSS item facts without copying article bodies', () => {
  const xml = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[Da Nang summer festival]]></title><link>https://danangfantasticity.com/en/event</link><description>Copyrighted body should not be retained</description><pubDate>Fri, 01 Aug 2026 01:00:00 GMT</pubDate></item></channel></rss>`;
  assert.deepEqual(parseOfficialFeed(xml), [{ title: 'Da Nang summer festival', sourceUrl: 'https://danangfantasticity.com/en/event', publishedAt: new Date('2026-08-01T01:00:00.000Z') }]);
});

test('scores official trends without inventing a growth metric', () => {
  const signal = enrichOfficialTrend(
    { title: 'Da Nang travel event', sourceUrl: 'https://danangfantasticity.com/en/event', publishedAt: new Date('2026-08-01T01:00:00.000Z') },
    { source: 'danang-fantasticity', reliability: 92, commercialUseStatus: 'TITLE_LINK_DATE_WITH_ATTRIBUTION' },
    new Date('2026-08-01T02:00:00.000Z'),
  );
  assert.equal(signal.scoreBreakdown.growthIsVerified, false);
  assert.equal(signal.scoreBreakdown.verifiedGrowth, 0);
  assert.equal(signal.geographicScope, 'Da Nang, Vietnam');
  assert.match(signal.dedupHash, /^[a-f0-9]{64}$/);
});

test('penalizes crisis topics even when they come from an official feed', () => {
  const signal = enrichOfficialTrend(
    { title: 'Tai nạn tại Đà Nẵng', sourceUrl: 'https://danangfantasticity.com/en/notice', publishedAt: new Date('2026-08-01T01:00:00.000Z') },
    { source: 'danang-fantasticity', reliability: 92, commercialUseStatus: 'TITLE_LINK_DATE_WITH_ATTRIBUTION' },
    new Date('2026-08-01T02:00:00.000Z'),
  );
  assert.deepEqual(signal.riskFlags, ['SENSITIVE_OR_CRISIS_TOPIC']);
  assert.equal(signal.score, 0);
});

test('FactGuard blocks unsupported numeric and risky claims', () => {
  const result = inspectFacts({ caption: 'Chỉ từ 500.000 VND, rẻ nhất Đà Nẵng', verifiedFacts: [] });
  assert.equal(result.passed, false);
  assert.ok(result.unsupported.length > 0);
  assert.ok(result.risky.length > 0);
});

test('FactGuard blocks non-numeric hallucinated amenities and undeclared facts', () => {
  const result = inspectFacts({ caption: 'Lune có hồ bơi riêng và đưa đón sân bay miễn phí.', verifiedFacts: [], factsUsed: ['Lune có hồ bơi riêng'] });
  assert.equal(result.passed, false);
  assert.ok(result.controlled.length > 0);
  assert.ok(result.unsupportedFacts.length > 0);
});

test('validates workflow transitions', () => {
  assert.equal(canTransition('APPROVED', 'SCHEDULED'), true);
  assert.throws(() => assertTransition('IDEA_PROPOSED', 'PUBLISHED'), /Invalid/);
});

test('detects MIME from bytes and creates path-safe names', () => {
  assert.equal(detectMime(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg');
  const name = safeStoredFilename('../../khách hàng.jpg', 'image/jpeg');
  assert.equal(name.includes('..'), false);
  assert.equal(name.endsWith('.jpg'), true);
});

test('classifies retries and bounds jitter', () => {
  assert.deepEqual(classifyPublishError(401), { retry: false, category: 'AUTH_RECONNECT_REQUIRED' });
  assert.deepEqual(classifyPublishError(429), { retry: true, category: 'RATE_LIMIT' });
  assert.equal(retryDelayMs(2, { baseMs: 1000, random: () => 0 }), 1500);
});

test('database jobs stop on auth errors but retry rate limits', () => {
  const job = { attempts: 1, maxAttempts: 5 };
  assert.equal(isTerminalJobFailure(job, { status: 401 }), true);
  assert.equal(isTerminalJobFailure(job, { status: 429, retryable: true }), false);
  assert.equal(isTerminalJobFailure({ attempts: 5, maxAttempts: 5 }, { status: 500 }), true);
});

test('quota guard stops optional cloud at eighty percent', () => {
  assert.equal(quotaDecision({ enabled: true, used: 79, hardLimit: 100 }).allowed, true);
  assert.equal(quotaDecision({ enabled: true, used: 80, hardLimit: 100 }).reason, 'EIGHTY_PERCENT_GUARD');
});

test('analytics guards zero reach', () => {
  assert.deepEqual(calculateRates({ reach: 0, reactions: 2, comments: 1, shares: 1, linkClicks: 1 }), {
    interactions: 4,
    engagementRate: 4,
    clickRate: 1,
  });
});

test('validates caption schema strictly', () => {
  const valid = { primary_language: 'vi', secondary_language: 'en', headline: 'Lune', caption_vi: 'Xin chào', caption_en: 'Hello', caption_ko_optional: null, short_caption: 'Lune', cta: 'Liên hệ', hashtags: ['#Lune'], alt_text: 'Phòng Lune', facts_used: [], source_ids: [], risk_flags: [], confidence: 0.8, recommended_publish_time: null };
  assert.equal(parseCaption(valid).headline, 'Lune');
  assert.throws(() => parseCaption({ ...valid, confidence: 2 }));
});

test('encrypts Meta token with authenticated page-bound encryption', () => {
  const key = '11'.repeat(32); const encrypted = encryptMetaToken('secret-page-token', { encodedKey: key, keyVersion: 'v1', pageId: '61582233127486' });
  assert.equal(decryptMetaToken({ ...encrypted, pageId: '61582233127486' }, { encodedKey: key }), 'secret-page-token');
  assert.throws(() => decryptMetaToken({ ...encrypted, pageId: 'wrong' }, { encodedKey: key }));
});

test('publication hash is stable when Prisma returns assets in another order', () => {
  const input = { version: 2, captionVi: 'VI', captionEn: 'EN' };
  assert.equal(publicationContentHash({ ...input, mediaAssetIds: ['b', 'a'] }), publicationContentHash({ ...input, mediaAssetIds: ['a', 'b'] }));
});

test('schedules eight o clock in Asia Ho Chi Minh', () => {
  assert.equal(nextLocalSchedule(8, 0, new Date('2026-08-01T00:00:00.000Z')).toISOString(), '2026-08-01T01:00:00.000Z');
});

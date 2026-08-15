import crypto from 'node:crypto';
import { calculateRates } from '../domain/analytics.js';
import { normalizeTrendSignal, scoreTrend } from '../domain/trendScoring.js';

export class TrendSource { async fetch() { return []; } }
export class WeatherSource { async current() { return null; } }
export class EventSource { async list() { return []; } }
export class MediaAnalyzer { async analyze() { throw new Error('Abstract MediaAnalyzer method'); } }
export class AnalyticsProvider { async fetch() { return null; } }

export class ManualTrendSource extends TrendSource {
  constructor(prisma) { super(); this.prisma = prisma; }
  async fetch() { return this.prisma.aiTrendSignal.findMany({ where: { source: 'manual' }, orderBy: { fetchedAt: 'desc' } }); }
}

const OFFICIAL_FEEDS = Object.freeze([
  {
    id: 'danang-fantasticity-en',
    url: 'https://danangfantasticity.com/en?feed=rss2',
    source: 'danang-fantasticity',
    reliability: 92,
    commercialUseStatus: 'TITLE_LINK_DATE_WITH_ATTRIBUTION',
  },
]);

const ALLOWED_FEED_HOSTS = new Set(['danangfantasticity.com', 'www.danangfantasticity.com']);
const ENTITY_MAP = Object.freeze({ amp: '&', apos: "'", gt: '>', lt: '<', quot: '"', nbsp: ' ' });
const LOCAL_TERMS = ['da nang', 'đà nẵng', 'danang', 'my khe', 'mỹ khê', 'son tra', 'sơn trà'];
const TRAVEL_TERMS = ['travel', 'tourism', 'visitor', 'festival', 'event', 'beach', 'food', 'hotel', 'stay', 'du lịch', 'lễ hội', 'biển', 'ẩm thực', 'lưu trú'];
const RISK_TERMS = ['tai nạn', 'thảm họa', 'bão', 'lũ', 'tử vong', 'chính trị', 'biểu tình', 'khủng hoảng', 'accident', 'disaster', 'death', 'politic', 'protest', 'crisis'];

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(x?[0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code.replace(/^x/i, ''), /^x/i.test(code) ? 16 : 10)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITY_MAP[name.toLowerCase()] ?? match)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagValue(xml, names) {
  for (const name of names) {
    const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (match) return decodeXml(match[1]);
  }
  return '';
}

function atomLink(xml) {
  const match = xml.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i);
  return match ? decodeXml(match[1]) : '';
}

export function parseOfficialFeed(xml, { limit = 40 } = {}) {
  const blocks = [...String(xml).matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0, limit);
  return blocks.map(([, , block]) => {
    const title = tagValue(block, ['title']);
    const sourceUrl = tagValue(block, ['link', 'guid']) || atomLink(block);
    const rawDate = tagValue(block, ['pubDate', 'published', 'updated', 'dc:date']);
    const publishedAt = rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate) : null;
    return { title, sourceUrl, publishedAt };
  }).filter((item) => item.title && item.sourceUrl);
}

async function readBoundedBody(response, maxBytes) {
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('Official trend feed exceeds the configured size limit');
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new Error('Official trend feed exceeded the configured size limit'); }
    chunks.push(value);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks.map((value) => Buffer.from(value))));
}

function assertAllowedFeedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !ALLOWED_FEED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error('Trend feed URL is not on the fixed official allowlist');
  }
  return url;
}

export async function fetchOfficialFeed(url, { fetchImpl = fetch, timeoutMs = 10_000, maxBytes = 1024 * 1024 } = {}) {
  let current = assertAllowedFeedUrl(url);
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    const response = await fetchImpl(current, {
      redirect: 'manual',
      headers: { accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9', 'user-agent': 'LuneLocalContentAutomation/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirects === 2) throw new Error('Official trend feed redirected too many times');
      current = assertAllowedFeedUrl(new URL(response.headers.get('location') || '', current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Official trend feed returned HTTP ${response.status}`);
    return readBoundedBody(response, maxBytes);
  }
  throw new Error('Official trend feed could not be fetched');
}

function includesAny(text, terms) { return terms.some((term) => text.includes(term)); }
function recencyScore(publishedAt, now) {
  if (!publishedAt) return 35;
  const ageHours = Math.max(0, (now.getTime() - publishedAt.getTime()) / 3_600_000);
  if (ageHours <= 24) return 100;
  if (ageHours <= 72) return 85;
  if (ageHours <= 168) return 65;
  if (ageHours <= 720) return 40;
  return 15;
}

export function enrichOfficialTrend(item, feed, now = new Date(), customTerms = []) {
  const normalized = normalizeTrendSignal({ ...item, sourceUrl: assertAllowedFeedUrl(item.sourceUrl).toString(), source: feed.source, keywords: [] });
  const haystack = normalized.title.toLocaleLowerCase('vi');
  const locality = includesAny(haystack, LOCAL_TERMS) ? 100 : 70;
  const normalizedCustomTerms = customTerms.map((term) => String(term).toLocaleLowerCase('vi')).filter(Boolean);
  const relevanceToLune = includesAny(haystack, [...TRAVEL_TERMS, ...normalizedCustomTerms]) ? 85 : 55;
  const riskFlags = includesAny(haystack, RISK_TERMS) ? ['SENSITIVE_OR_CRISIS_TOPIC'] : [];
  const breakdown = {
    relevanceToLune, locality, recency: recencyScore(normalized.publishedAt, now),
    sourceReliability: feed.reliability, audienceFit: 75, availableMediaFit: 55,
    growthIsVerified: false, verifiedGrowth: 0, riskPenalty: riskFlags.length ? 80 : 0, repetitionPenalty: 0,
  };
  return {
    ...normalized,
    geographicScope: 'Da Nang, Vietnam',
    reliability: feed.reliability,
    commercialUseStatus: feed.commercialUseStatus,
    dedupHash: crypto.createHash('sha256').update(`${feed.source}\n${normalized.sourceUrl}\n${normalized.title.toLocaleLowerCase('vi')}`).digest('hex'),
    expiresAt: new Date(now.getTime() + 7 * 86_400_000),
    score: scoreTrend(breakdown),
    scoreBreakdown: breakdown,
    riskFlags,
  };
}

export class OfficialDanangTrendSource extends TrendSource {
  constructor(prisma, options = {}) { super(); this.prisma = prisma; this.fetchImpl = options.fetchImpl || fetch; this.feeds = options.feeds || OFFICIAL_FEEDS; }

  async fetch(now = new Date(), { keywords = [] } = {}) {
    const saved = [];
    const errors = [];
    for (const feed of this.feeds) {
      try {
        const xml = await fetchOfficialFeed(feed.url, { fetchImpl: this.fetchImpl });
        for (const item of parseOfficialFeed(xml)) {
          const signal = enrichOfficialTrend(item, feed, now, keywords);
          const data = {
            source: signal.source, sourceUrl: signal.sourceUrl, title: signal.title, summary: null,
            publishedAt: signal.publishedAt, fetchedAt: now, geographicScope: signal.geographicScope,
            keywords: signal.keywords, reliability: signal.reliability, commercialUseStatus: signal.commercialUseStatus,
            expiresAt: signal.expiresAt, score: signal.score, scoreBreakdown: signal.scoreBreakdown, riskFlags: signal.riskFlags,
          };
          saved.push(await this.prisma.aiTrendSignal.upsert({ where: { dedupHash: signal.dedupHash }, create: { ...data, dedupHash: signal.dedupHash }, update: data }));
        }
      } catch (error) {
        errors.push({ source: feed.id, message: String(error?.message || error).slice(0, 300) });
      }
    }
    if (!saved.length && errors.length) { const error = new Error('No official trend source could be refreshed'); error.causes = errors; throw error; }
    return { signals: saved, errors };
  }
}

export class NoOpWeatherSource extends WeatherSource {}
export class NoOpEventSource extends EventSource {}

export class MockAnalyticsProvider extends AnalyticsProvider {
  async fetch(publication, windowHours = 24) {
    const publicationId = typeof publication === 'string' ? publication : publication.id;
    const seed = [...publicationId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const reach = 50 + (seed % 151); const reactions = seed % 18; const comments = seed % 5; const shares = seed % 4; const linkClicks = seed % 7;
    return { publicationId, windowHours, reach, impressions: reach + (seed % 40), reactions, comments, shares, linkClicks, videoViews: seed % 80, ...calculateRates({ reach, reactions, comments, shares, linkClicks }), mock: true };
  }
}

function insightValue(payload, name) {
  const metric = payload?.insights?.data?.find((item) => item.name === name);
  const value = metric?.values?.at(-1)?.value ?? metric?.value ?? 0;
  return Number(typeof value === 'object' ? Object.values(value).reduce((sum, item) => sum + (Number(item) || 0), 0) : value) || 0;
}

export class MetaAnalyticsProvider extends AnalyticsProvider {
  constructor({ graphVersion, accessToken, baseUrl = 'https://graph.facebook.com', fetchImpl = fetch }) {
    super(); Object.assign(this, { graphVersion, accessToken, baseUrl, fetchImpl });
  }

  async fetch(publication, windowHours = 24) {
    if (!publication.remotePostId) throw new Error('Published Meta post does not have a remote id');
    const url = new URL(`${this.baseUrl}/${this.graphVersion}/${publication.remotePostId}`);
    url.searchParams.set('fields', 'reactions.limit(0).summary(true),comments.limit(0).summary(true),shares,insights.metric(post_impressions_unique,post_impressions,post_clicks,post_video_views)');
    const response = await this.fetchImpl(url, { headers: { authorization: `Bearer ${this.accessToken}` }, signal: AbortSignal.timeout(30_000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `Meta analytics HTTP ${response.status}`), { status: response.status });
    const reach = insightValue(payload, 'post_impressions_unique');
    const reactions = Number(payload?.reactions?.summary?.total_count || 0);
    const comments = Number(payload?.comments?.summary?.total_count || 0);
    const shares = Number(payload?.shares?.count || 0);
    const linkClicks = insightValue(payload, 'post_clicks');
    return {
      publicationId: publication.id, windowHours, reach, reactions, comments, shares, linkClicks,
      impressions: insightValue(payload, 'post_impressions'), videoViews: insightValue(payload, 'post_video_views'),
      ...calculateRates({ reach, reactions, comments, shares, linkClicks }), mock: false,
    };
  }
}

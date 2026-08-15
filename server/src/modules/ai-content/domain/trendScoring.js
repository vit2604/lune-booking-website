const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

export function normalizeTrendSignal(input) {
  const title = String(input.title || '').trim().replace(/\s+/g, ' ');
  const source = String(input.source || '').trim().toLowerCase();
  const sourceUrl = input.sourceUrl ? new URL(input.sourceUrl).toString() : null;
  return {
    ...input,
    title,
    source,
    sourceUrl,
    keywords: [...new Set((input.keywords || []).map((item) => String(item).trim().toLowerCase()).filter(Boolean))],
  };
}

export function repetitionPenalty({ recentTitles = [], title = '', recentMediaUses = 0 }) {
  const words = new Set(title.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3));
  const maxOverlap = recentTitles.reduce((max, candidate) => {
    const other = new Set(String(candidate).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3));
    const overlap = [...words].filter((word) => other.has(word)).length / Math.max(words.size, 1);
    return Math.max(max, overlap);
  }, 0);
  return clamp(maxOverlap * 35 + Math.max(0, recentMediaUses - 2) * 8);
}

export function scoreTrend(input) {
  const values = Object.fromEntries(
    ['relevanceToLune', 'locality', 'recency', 'sourceReliability', 'audienceFit', 'availableMediaFit']
      .map((key) => [key, clamp(input[key])]),
  );
  const verifiedGrowth = input.growthIsVerified ? clamp(input.verifiedGrowth) : 0;
  const score = values.relevanceToLune * 0.25
    + values.locality * 0.15
    + values.recency * 0.15
    + verifiedGrowth * 0.10
    + values.sourceReliability * 0.15
    + values.audienceFit * 0.10
    + values.availableMediaFit * 0.10
    - clamp(input.riskPenalty)
    - clamp(input.repetitionPenalty);
  return Math.round(clamp(score) * 100) / 100;
}

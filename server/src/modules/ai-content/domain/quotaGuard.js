export function quotaDecision({ enabled, used, hardLimit }) {
  if (!enabled) return { allowed: false, reason: 'DISABLED' };
  if (!Number.isFinite(hardLimit) || hardLimit <= 0) return { allowed: false, reason: 'NO_HARD_LIMIT' };
  const ratio = Math.max(0, used) / hardLimit;
  if (ratio >= 0.8) return { allowed: false, reason: 'EIGHTY_PERCENT_GUARD', ratio };
  return { allowed: true, reason: 'WITHIN_QUOTA', ratio };
}

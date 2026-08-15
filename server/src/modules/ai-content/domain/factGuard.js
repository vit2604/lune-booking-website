const NUMERIC_CLAIM = /(?:\b\d+(?:[.,]\d+)?\s*(?:%|km|m|phút|minutes?|giờ|hours?|đêm|nights?|vnd|₫|đồng)\b|\b(?:giá|price|chỉ từ|from)\s*\d+)/giu;
const RISKY_CLAIMS = [
  /(?:rẻ nhất|best price|lowest price)/iu,
  /(?:còn duy nhất|last room|sắp hết|hurry)/iu,
  /(?:giảm giá|discount|ưu đãi|promotion)/iu,
  /(?:đi bộ|walk|cách .*? phút|minutes? from)/iu,
];
const CONTROLLED_CLAIMS = [
  /(?:hồ bơi|swimming pool|pool riêng|private pool)/iu,
  /(?:đưa đón sân bay|airport transfer|airport shuttle)/iu,
  /(?:bữa sáng miễn phí|free breakfast|complimentary breakfast)/iu,
  /(?:miễn phí|free|complimentary)/iu,
  /(?:view biển|sea view|ocean view|beachfront)/iu,
  /(?:bãi đỗ xe|parking)/iu,
  /(?:phòng gym|gym|fitness center)/iu,
  /(?:spa|nhà hàng|restaurant|bar)/iu,
  /(?:phòng trống|available rooms?|vacancy)/iu,
  /(?:đặt phòng ngay|book now).*(?:còn|available|last)/iu,
];

function normalized(value) {
  return String(value).normalize('NFKC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
}

export function inspectFacts({ caption, verifiedFacts = [], allowedClaims = [], factsUsed = [] }) {
  const text = normalized(caption);
  const evidence = [...verifiedFacts, ...allowedClaims].map(normalized);
  const extracted = [...text.matchAll(NUMERIC_CLAIM)].map((match) => match[0]);
  const risky = RISKY_CLAIMS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  const unsupported = extracted.filter((claim) => !evidence.some((fact) => fact.includes(normalized(claim))));
  const controlled = CONTROLLED_CLAIMS.map((pattern) => text.match(pattern)?.[0]).filter(Boolean).filter((claim) => !evidence.some((fact) => fact.includes(normalized(claim))));
  const unsupportedFacts = factsUsed.map(normalized).filter(Boolean).filter((claim) => !evidence.some((fact) => fact === claim || fact.includes(claim) || claim.includes(fact)));
  return {
    passed: unsupported.length === 0 && risky.length === 0 && controlled.length === 0 && unsupportedFacts.length === 0,
    extracted,
    unsupported,
    risky,
    controlled,
    unsupportedFacts,
  };
}

export function assertFacts(input) {
  const result = inspectFacts(input);
  if (!result.passed) {
    const error = new Error('FactGuard blocked unverified content');
    error.code = 'FACT_GUARD_BLOCKED';
    error.details = result;
    throw error;
  }
  return result;
}

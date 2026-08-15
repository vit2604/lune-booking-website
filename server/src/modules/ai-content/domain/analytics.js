export function calculateRates({ reach = 0, reactions = 0, comments = 0, shares = 0, linkClicks = 0 }) {
  const denominator = Math.max(Number(reach) || 0, 1);
  const interactions = [reactions, comments, shares].reduce((sum, value) => sum + (Number(value) || 0), 0);
  return {
    interactions,
    engagementRate: interactions / denominator,
    clickRate: (Number(linkClicks) || 0) / denominator,
  };
}

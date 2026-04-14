/**
 * calculateMarketPrices — used by the official market_studies flow.
 */
interface Comparable {
  price: number | null;
  price_per_sqm: number | null;
  is_approved: boolean;
}

export interface MarketCalcResult {
  avg_price: number;
  median_price: number;
  avg_price_per_sqm: number;
  suggested_market_price: number;
  suggested_aspirational_price: number;
  suggested_fast_sale_price: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateMarketPrices(comparables: Comparable[]): MarketCalcResult {
  const approved = comparables.filter(c => c.is_approved && c.price != null);
  const prices = approved.map(c => c.price!);
  const pricesPerSqm = approved.filter(c => c.price_per_sqm != null).map(c => c.price_per_sqm!);

  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const medianPrice = median(prices);
  const avgPricePerSqm = pricesPerSqm.length > 0 ? pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length : 0;

  return {
    avg_price: Math.round(avgPrice),
    median_price: Math.round(medianPrice),
    avg_price_per_sqm: Math.round(avgPricePerSqm),
    suggested_market_price: Math.round(medianPrice),
    suggested_aspirational_price: Math.round(medianPrice * 1.15),
    suggested_fast_sale_price: Math.round(medianPrice * 0.85),
  };
}

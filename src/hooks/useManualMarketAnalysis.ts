/**
 * Manual market analysis calculations.
 * Operates only on data the broker has entered manually — no scraping.
 */
export interface ManualComparable {
  id?: string;
  price?: number | null;
  area?: number | null;
  is_approved?: boolean;
}

export interface ManualAnalysisResult {
  used_count: number;
  total_count: number;
  discarded_count: number;
  avg_price_per_sqm: number;
  median_price_per_sqm: number;
  min_price_per_sqm: number;
  max_price_per_sqm: number;
  p25_price_per_sqm: number;
  p75_price_per_sqm: number;
  // Faixas (preço total estimado, baseado em metragem do imóvel avaliado)
  conservative_min: number;
  conservative_max: number;
  average_min: number;
  average_max: number;
  aggressive_min: number;
  aggressive_max: number;
  // Sugestões para a apresentação
  suggested_market_price: number;
  suggested_fast_sale_price: number;
  suggested_aspirational_price: number;
  diff_vs_owner: number | null;
  diff_vs_owner_pct: number | null;
  confidence_level: "high" | "medium" | "low";
  warning?: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export function calculateManualAnalysis(
  comparables: ManualComparable[],
  subjectArea: number | null | undefined,
  ownerExpectedPrice: number | null | undefined,
): ManualAnalysisResult {
  const valid = comparables.filter(
    (c) =>
      (c.is_approved !== false) &&
      c.price != null &&
      c.area != null &&
      Number(c.area) > 0 &&
      Number(c.price) > 0,
  );
  const pricesPerSqm = valid.map((c) => Number(c.price) / Number(c.area));

  const used = valid.length;
  const total = comparables.length;

  if (used === 0) {
    return {
      used_count: 0, total_count: total, discarded_count: total,
      avg_price_per_sqm: 0, median_price_per_sqm: 0,
      min_price_per_sqm: 0, max_price_per_sqm: 0,
      p25_price_per_sqm: 0, p75_price_per_sqm: 0,
      conservative_min: 0, conservative_max: 0,
      average_min: 0, average_max: 0,
      aggressive_min: 0, aggressive_max: 0,
      suggested_market_price: 0, suggested_fast_sale_price: 0, suggested_aspirational_price: 0,
      diff_vs_owner: null, diff_vs_owner_pct: null,
      confidence_level: "low",
      warning: "Nenhum comparável válido com preço e metragem informados.",
    };
  }

  const avg = pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length;
  const med = median(pricesPerSqm);
  const minP = Math.min(...pricesPerSqm);
  const maxP = Math.max(...pricesPerSqm);
  const p25 = percentile(pricesPerSqm, 0.25);
  const p75 = percentile(pricesPerSqm, 0.75);

  const area = subjectArea && subjectArea > 0 ? Number(subjectArea) : 0;
  const toPrice = (ppsqm: number) => Math.round(ppsqm * area);

  const suggestedMarket = toPrice(med);
  const suggestedFast = Math.round(suggestedMarket * 0.92);
  const suggestedAspirational = Math.round(suggestedMarket * 1.1);

  const diff = ownerExpectedPrice && suggestedMarket
    ? Number(ownerExpectedPrice) - suggestedMarket : null;
  const diffPct = diff != null && suggestedMarket > 0
    ? (diff / suggestedMarket) * 100 : null;

  let confidence: "high" | "medium" | "low" = "high";
  let warning: string | undefined;
  if (used < 3) {
    confidence = "low";
    warning = "A análise pode ser pouco confiável porque há poucos imóveis comparáveis.";
  } else if (used < 5) {
    confidence = "medium";
  }

  return {
    used_count: used,
    total_count: total,
    discarded_count: total - used,
    avg_price_per_sqm: Math.round(avg),
    median_price_per_sqm: Math.round(med),
    min_price_per_sqm: Math.round(minP),
    max_price_per_sqm: Math.round(maxP),
    p25_price_per_sqm: Math.round(p25),
    p75_price_per_sqm: Math.round(p75),
    conservative_min: toPrice(minP),
    conservative_max: toPrice(p25),
    average_min: toPrice(p25),
    average_max: toPrice(p75),
    aggressive_min: toPrice(p75),
    aggressive_max: toPrice(maxP),
    suggested_market_price: suggestedMarket,
    suggested_fast_sale_price: suggestedFast,
    suggested_aspirational_price: suggestedAspirational,
    diff_vs_owner: diff,
    diff_vs_owner_pct: diffPct,
    confidence_level: confidence,
    warning,
  };
}

export function detectPortalFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("vivareal")) return "VivaReal";
    if (host.includes("zapimoveis") || host.includes("zap.com")) return "ZAP Imóveis";
    if (host.includes("olx")) return "OLX";
    if (host.includes("imovelweb")) return "Imovelweb";
    if (host.includes("quintoandar")) return "QuintoAndar";
    if (host.includes("chaves")) return "ChavesNaMão";
    if (host.includes("loft")) return "Loft";
    if (host.includes("mercadolivre")) return "Mercado Livre";
    return host;
  } catch {
    return "Outro";
  }
}

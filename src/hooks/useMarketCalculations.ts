/** 
 * @deprecated useSaveMarketReport writes to legacy market_reports table.
 * calculateMarketPrices is still used by the official flow.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useSaveMarketReport(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calc: MarketCalcResult) => {
      // Upsert: delete existing then insert
      await supabase.from("market_reports").delete().eq("market_analysis_job_id", jobId);
      const { error } = await supabase.from("market_reports").insert({
        market_analysis_job_id: jobId,
        avg_price: calc.avg_price,
        median_price: calc.median_price,
        avg_price_per_sqm: calc.avg_price_per_sqm,
        suggested_market_price: calc.suggested_market_price,
        suggested_aspirational_price: calc.suggested_aspirational_price,
        suggested_fast_sale_price: calc.suggested_fast_sale_price,
        confidence_level: "medium",
        summary: `Análise baseada em ${calc.avg_price > 0 ? "comparáveis aprovados" : "dados insuficientes"}.`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-report", jobId] });
    },
  });
}

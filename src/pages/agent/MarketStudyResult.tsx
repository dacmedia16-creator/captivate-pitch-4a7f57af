import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText, Building2, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { AdjustmentBadge } from "@/components/market-study/AdjustmentBadge";
import { scoredComparables } from "@/hooks/useMarketSimilarity";
import { calculateAllAdjustments, calculateMarketResult } from "@/hooks/useMarketAdjustments";
import { toast } from "sonner";
import { useState } from "react";

export default function MarketStudyResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recalculating, setRecalculating] = useState(false);

  const { data: study, isLoading } = useQuery({
    queryKey: ["market-study", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_studies")
        .select("*, market_study_subject_properties(*), market_study_results(*), market_study_comparables(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: adjustmentsMap } = useQuery({
    queryKey: ["market-study-adjustments", id],
    queryFn: async () => {
      const comparables = (study as any)?.market_study_comparables ?? [];
      if (comparables.length === 0) return {};
      const ids = comparables.map((c: any) => c.id);
      const { data } = await supabase
        .from("market_study_adjustments")
        .select("*")
        .in("comparable_id", ids);
      const map: Record<string, any[]> = {};
      (data ?? []).forEach((a: any) => {
        if (!map[a.comparable_id]) map[a.comparable_id] = [];
        map[a.comparable_id].push(a);
      });
      return map;
    },
    enabled: !!study && ((study as any)?.market_study_comparables ?? []).length > 0,
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ compId, approved }: { compId: string; approved: boolean }) => {
      const { error } = await supabase
        .from("market_study_comparables")
        .update({ is_approved: approved })
        .eq("id", compId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-study", id] });
    },
  });

  const handleRecalculate = async () => {
    if (!study) return;
    setRecalculating(true);
    try {
      const subject = (study as any).market_study_subject_properties?.[0];
      const comparables = ((study as any).market_study_comparables ?? []).filter((c: any) => c.is_approved);

      if (!subject || comparables.length === 0) {
        toast.error("Nenhum comparável aprovado para recalcular");
        return;
      }

      // Recalculate similarity
      const scored = scoredComparables(subject, comparables, undefined, 0);
      for (const comp of scored) {
        await supabase
          .from("market_study_comparables")
          .update({ similarity_score: comp.similarity_score })
          .eq("id", comp.id);
      }

      // Recalculate adjustments
      const adjusted = calculateAllAdjustments(subject, scored.map(c => ({
        id: c.id,
        price: Number(c.price),
        suites: c.suites,
        parking_spots: c.parking_spots,
        conservation_state: c.conservation_state,
        construction_standard: c.construction_standard,
        area: Number(c.area),
        differentials: c.differentials,
      })));

      // Clear old adjustments and save new ones
      const compIds = comparables.map((c: any) => c.id);
      await supabase.from("market_study_adjustments").delete().in("comparable_id", compIds);

      for (const comp of adjusted) {
        await supabase
          .from("market_study_comparables")
          .update({ adjusted_price: comp.adjusted_price })
          .eq("id", comp.comparable_id);

        if (comp.adjustments.length > 0) {
          await supabase.from("market_study_adjustments").insert(
            comp.adjustments.map((a) => ({
              comparable_id: comp.comparable_id,
              adjustment_type: a.adjustment_type,
              label: a.label,
              percentage: a.percentage,
              value: a.value,
              direction: a.direction,
            }))
          );
        }
      }

      // Update results
      const result = calculateMarketResult(adjusted);
      const subjectArea = subject.area_useful || subject.area_built || subject.area_land;
      const avgPricePerSqm = subjectArea && subjectArea > 0
        ? Math.round(result.avg_price / subjectArea)
        : 0;

      await supabase.from("market_study_results").delete().eq("market_study_id", id!);
      await supabase.from("market_study_results").insert({
        market_study_id: id!,
        avg_price: result.avg_price,
        median_price: result.median_price,
        avg_price_per_sqm: avgPricePerSqm,
        suggested_ad_price: result.suggested_ad_price,
        suggested_market_price: result.suggested_market_price,
        suggested_fast_sale_price: result.suggested_fast_sale_price,
        price_range_min: result.price_range_min,
        price_range_max: result.price_range_max,
        confidence_level: adjusted.length >= 5 ? "high" : adjusted.length >= 3 ? "medium" : "low",
      });

      queryClient.invalidateQueries({ queryKey: ["market-study", id] });
      queryClient.invalidateQueries({ queryKey: ["market-study-adjustments", id] });
      toast.success("Recálculo concluído!");
    } catch (err: any) {
      toast.error("Erro ao recalcular: " + (err.message || "erro"));
    } finally {
      setRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">Estudo não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/market-studies")}>
          Voltar
        </Button>
      </div>
    );
  }

  const subject = (study as any).market_study_subject_properties?.[0];
  const result = (study as any).market_study_results?.[0];
  const comparables = (study as any).market_study_comparables ?? [];

  const fmt = (v?: number | null) =>
    v != null
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
      : "—";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/market-studies")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">{study.title || "Estudo de Mercado"}</h1>
          <p className="text-sm text-muted-foreground">
            {[subject?.neighborhood, subject?.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? "animate-spin" : ""}`} />
            Recalcular
          </Button>
          <Badge variant={study.status === "completed" ? "default" : "secondary"}>
            {study.status === "completed" ? "Concluído" : study.status === "draft" ? "Rascunho" : study.status}
          </Badge>
        </div>
      </div>

      {/* Subject Property Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Imóvel Avaliado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subject ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{subject.property_category || "—"}</span></div>
              <div><span className="text-muted-foreground">Área:</span> <span className="font-medium">{subject.area_useful || subject.area_built || "—"} m²</span></div>
              <div><span className="text-muted-foreground">Quartos:</span> <span className="font-medium">{subject.bedrooms ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Suítes:</span> <span className="font-medium">{subject.suites ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Vagas:</span> <span className="font-medium">{subject.parking_spots ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Padrão:</span> <span className="font-medium">{subject.construction_standard || "—"}</span></div>
              <div><span className="text-muted-foreground">Conservação:</span> <span className="font-medium">{subject.conservation_state || "—"}</span></div>
              <div><span className="text-muted-foreground">Preço esperado:</span> <span className="font-medium">{fmt(subject.owner_expected_price)}</span></div>
            </div>
          ) : (
            <p className="text-muted-foreground">Dados do imóvel não disponíveis</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Preço Médio", value: fmt(result.avg_price) },
              { label: "R$/m² Médio", value: fmt(result.avg_price_per_sqm) },
              { label: "Sugestão Anúncio", value: fmt(result.suggested_ad_price) },
              { label: "Venda Rápida", value: fmt(result.suggested_fast_sale_price) },
            ].map((m) => (
              <Card key={m.label} className="glass-card">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold text-primary mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {result.executive_summary && (
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-lg">Resumo Executivo</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">{result.executive_summary}</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {study.status === "draft"
                ? "Este estudo ainda não foi processado. Os resultados aparecerão aqui após a análise."
                : "Resultados ainda não disponíveis."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparables */}
      {comparables.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Comparáveis ({comparables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Imóvel</th>
                    <th className="text-right py-2 px-2">Preço Original</th>
                    <th className="text-right py-2 px-2">Preço Ajustado</th>
                    <th className="text-right py-2 px-2">R$/m²</th>
                    <th className="text-center py-2 px-2">Score</th>
                    <th className="text-center py-2 px-2">Ajustes</th>
                    <th className="text-center py-2 px-2">Status</th>
                    <th className="text-center py-2 pl-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((c: any) => {
                    const compAdjustments = adjustmentsMap?.[c.id] ?? [];
                    return (
                      <tr key={c.id} className={`border-b border-border/50 ${!c.is_approved ? "opacity-50" : ""}`}>
                        <td className="py-2 pr-4">
                          <p className="font-medium">{c.title || c.address || "Sem título"}</p>
                          <p className="text-xs text-muted-foreground">{c.neighborhood}</p>
                        </td>
                        <td className="text-right py-2 px-2">{fmt(c.price)}</td>
                        <td className="text-right py-2 px-2 font-medium text-primary">
                          {c.adjusted_price ? fmt(c.adjusted_price) : "—"}
                        </td>
                        <td className="text-right py-2 px-2">{fmt(c.price_per_sqm)}</td>
                        <td className="text-center py-2 px-2">
                          <Badge variant={Number(c.similarity_score) >= 70 ? "default" : "secondary"}>
                            {Number(c.similarity_score).toFixed(0)}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {compAdjustments.length > 0
                              ? compAdjustments.slice(0, 3).map((a: any) => (
                                  <AdjustmentBadge
                                    key={a.id}
                                    direction={a.direction}
                                    percentage={Number(a.percentage)}
                                    label={a.label}
                                  />
                                ))
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                            {compAdjustments.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{compAdjustments.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-2 px-2">
                          <Badge variant={c.listing_status === "active" ? "default" : "secondary"}>
                            {c.listing_status === "active" ? "Ativo" : c.listing_status === "sold" ? "Vendido" : c.listing_status || "—"}
                          </Badge>
                        </td>
                        <td className="text-center py-2 pl-2">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleApproval.mutate({ compId: c.id, approved: !c.is_approved })}
                            >
                              {c.is_approved ? (
                                <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, FileText, Building2, ThumbsUp, ThumbsDown,
  RefreshCw, Sparkles, TrendingUp, DollarSign, BarChart3, Home,
  FileDown, Presentation, ScatterChart, ExternalLink, Search,
  AlertTriangle, CheckCircle, XCircle, Clock, Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdjustmentBadge } from "@/components/market-study/AdjustmentBadge";
import { PriceRangeGauge } from "@/components/market-study/PriceRangeGauge";
import { MarketInsights, generateAutoInsights } from "@/components/market-study/MarketInsights";
import { PricePerSqmChart } from "@/components/market-study/PricePerSqmChart";
import { MarketScatterChart, ComparableChartData } from "@/components/charts/MarketCharts";
import { MetricCard } from "@/components/shared/MetricCard";
import { scoredComparables } from "@/hooks/useMarketSimilarity";
import { calculateAllAdjustments, calculateMarketResult } from "@/hooks/useMarketAdjustments";
import { toast } from "sonner";
import { useState } from "react";

export default function MarketStudyResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recalculating, setRecalculating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [creatingPresentation, setCreatingPresentation] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["market-study", id] }),
  });

  const deleteComparable = useMutation({
    mutationFn: async (compId: string) => {
      // Delete associated adjustments first
      await supabase.from("market_study_adjustments").delete().eq("comparable_id", compId);
      const { error } = await supabase.from("market_study_comparables").delete().eq("id", compId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-study", id] });
      toast.success("Comparável excluído");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir comparável"),
  });


    if (!study) return;
    setRecalculating(true);
    try {
      const subject = (study as any).market_study_subject_properties?.[0];
      const comparables = ((study as any).market_study_comparables ?? []).filter((c: any) => c.is_approved);
      if (!subject || comparables.length === 0) {
        toast.error("Nenhum comparável aprovado para recalcular");
        return;
      }
      const scored = scoredComparables(subject, comparables, undefined, 0);
      for (const comp of scored) {
        await supabase.from("market_study_comparables").update({ similarity_score: comp.similarity_score } as any).eq("id", comp.id);
      }
      const adjusted = calculateAllAdjustments(subject, scored.map(c => ({
        id: c.id, price: Number(c.price), suites: c.suites, parking_spots: c.parking_spots,
        conservation_state: c.conservation_state, construction_standard: c.construction_standard,
        area: Number(c.area), differentials: c.differentials,
      })));
      const compIds = comparables.map((c: any) => c.id);
      await supabase.from("market_study_adjustments").delete().in("comparable_id", compIds);
      for (const comp of adjusted) {
        await supabase.from("market_study_comparables").update({ adjusted_price: comp.adjusted_price }).eq("id", comp.comparable_id);
        if (comp.adjustments.length > 0) {
          await supabase.from("market_study_adjustments").insert(
            comp.adjustments.map((a) => ({
              comparable_id: comp.comparable_id, adjustment_type: a.adjustment_type,
              label: a.label, percentage: a.percentage, value: a.value, direction: a.direction,
            }))
          );
        }
      }
      const result = calculateMarketResult(adjusted);
      const subjectArea = subject.area_useful || subject.area_built || subject.area_land;
      const avgPricePerSqm = subjectArea && subjectArea > 0 ? Math.round(result.avg_price / subjectArea) : 0;
      await supabase.from("market_study_results").delete().eq("market_study_id", id!);
      await supabase.from("market_study_results").insert({
        market_study_id: id!, avg_price: result.avg_price, median_price: result.median_price,
        avg_price_per_sqm: avgPricePerSqm, suggested_ad_price: result.suggested_ad_price,
        suggested_market_price: result.suggested_market_price, suggested_fast_sale_price: result.suggested_fast_sale_price,
        price_range_min: result.price_range_min, price_range_max: result.price_range_max,
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

  const handleGenerateAI = async () => {
    if (!study) return;
    const subject = (study as any).market_study_subject_properties?.[0];
    const result = (study as any).market_study_results?.[0];
    const comparables = ((study as any).market_study_comparables ?? []).filter((c: any) => c.is_approved);
    if (!result || comparables.length === 0) {
      toast.error("Calcule os resultados antes de gerar o resumo com IA");
      return;
    }
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-market-summary", {
        body: { subject, comparables, result },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      await supabase.from("market_study_results").update({
        executive_summary: data.executive_summary,
        justification: data.justification,
        market_insights: data.insights,
      }).eq("id", result.id);

      queryClient.invalidateQueries({ queryKey: ["market-study", id] });
      toast.success("Resumo executivo gerado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar resumo: " + (err.message || "erro"));
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleExportPDF = async () => {
    if (!id) return;
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-market-study-pdf", {
        body: { market_study_id: id },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      window.open(data.url, "_blank");
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao exportar: " + (err.message || "erro"));
    } finally {
      setExportingPDF(false);
    }
  };

  const handleCreatePresentation = async () => {
    if (!study || !id) return;
    const subject = (study as any).market_study_subject_properties?.[0];
    const result = (study as any).market_study_results?.[0];
    const comparables = ((study as any).market_study_comparables ?? []).filter((c: any) => c.is_approved);

    setCreatingPresentation(true);
    try {
      // Get user profile for tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      // Create presentation
      const { data: pres, error: presErr } = await supabase.from("presentations").insert({
        broker_id: user.id,
        tenant_id: profile.tenant_id,
        title: study.title || "Apresentação de Captação",
        property_type: subject?.property_type || subject?.property_category,
        neighborhood: subject?.neighborhood,
        city: subject?.city,
        address: subject?.address,
        area_total: subject?.area_useful || subject?.area_built,
        bedrooms: subject?.bedrooms,
        suites: subject?.suites,
        parking_spots: subject?.parking_spots,
        property_standard: subject?.construction_standard,
        owner_expected_price: subject?.owner_expected_price,
        condominium: subject?.condominium,
        status: "draft",
        creation_mode: "market_study",
      }).select("id").single();

      if (presErr || !pres) throw presErr || new Error("Erro ao criar apresentação");

      // Create sections
      const sections: Array<{ presentation_id: string; section_key: string; title: string; sort_order: number; content: any }> = [
        {
          presentation_id: pres.id,
          section_key: "property_summary",
          title: "Resumo do Imóvel",
          sort_order: 1,
          content: {
            property_type: subject?.property_type || subject?.property_category,
            area_total: subject?.area_useful || subject?.area_built,
            bedrooms: subject?.bedrooms,
            suites: subject?.suites,
            parking_spots: subject?.parking_spots,
            property_standard: subject?.construction_standard,
            highlights: subject?.observations,
          },
        },
        {
          presentation_id: pres.id,
          section_key: "pricing_scenarios",
          title: "Cenários de Preço",
          sort_order: 2,
          content: {
            owner_expected_price: subject?.owner_expected_price,
            scenarios: [
              { label: "Venda Acelerada", value: result?.suggested_fast_sale_price },
              { label: "Preço de Mercado", value: result?.suggested_market_price },
              { label: "Aspiracional", value: result?.suggested_ad_price },
            ],
          },
        },
      ];

      if (result?.executive_summary || result?.justification) {
        sections.push({
          presentation_id: pres.id,
          section_key: "market_analysis",
          title: "Análise de Mercado",
          sort_order: 3,
          content: {
            executive_summary: result.executive_summary || "",
            justification: result.justification || "",
          },
        });
      }

      if (comparables.length > 0) {
        sections.push({
          presentation_id: pres.id,
          section_key: "comparables",
          title: "Comparativos de Mercado",
          sort_order: 4,
          content: {
            comparables: comparables.slice(0, 6).map((c: any) => ({
              title: c.title || c.address,
              neighborhood: c.neighborhood,
              price: c.price,
              adjusted_price: c.adjusted_price,
              area: c.area,
              price_per_sqm: c.price_per_sqm,
              similarity_score: c.similarity_score,
            })),
          },
        });
      }

      await supabase.from("presentation_sections").insert(sections);

      toast.success("Apresentação criada!");
      navigate(`/presentations/${pres.id}/edit`);
    } catch (err: any) {
      toast.error("Erro ao criar apresentação: " + (err.message || "erro"));
    } finally {
      setCreatingPresentation(false);
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
        <Button variant="outline" className="mt-4" onClick={() => navigate("/market-studies")}>Voltar</Button>
      </div>
    );
  }

  const subject = (study as any).market_study_subject_properties?.[0];
  const result = (study as any).market_study_results?.[0];
  const comparables = (study as any).market_study_comparables ?? [];
  const approvedComparables = comparables.filter((c: any) => c.is_approved);

  const fmt = (v?: number | null) =>
    v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";

  const aiInsights = result?.market_insights as any[] | null;
  const autoInsights = result ? generateAutoInsights(result, subject?.owner_expected_price, approvedComparables.length) : [];
  const displayInsights = aiInsights && aiInsights.length > 0 ? aiInsights : autoInsights;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/market-studies")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold font-display truncate">{study.title || "Estudo de Mercado"}</h1>
          <p className="text-sm text-muted-foreground">
            {[subject?.neighborhood, subject?.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? "animate-spin" : ""}`} />
            Recalcular
          </Button>
          <Button size="sm" onClick={handleGenerateAI} disabled={generatingAI || !result} className="gold-gradient text-primary-foreground">
            <Sparkles className={`h-4 w-4 mr-2 ${generatingAI ? "animate-pulse" : ""}`} />
            {generatingAI ? "Gerando..." : "Resumo IA"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exportingPDF || !result}>
            {exportingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreatePresentation} disabled={creatingPresentation}>
            {creatingPresentation ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Presentation className="h-4 w-4 mr-2" />}
            Apresentação
          </Button>
          <Badge variant={study.status === "completed" ? "default" : "secondary"}>
            {study.status === "completed" ? "Concluído" : study.status === "draft" ? "Rascunho" : study.status}
          </Badge>
        </div>
      </div>

      {/* Subject Property */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
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

      {/* Results Section */}
      {result ? (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Preço Médio" value={fmt(result.avg_price)} icon={DollarSign} />
            <MetricCard title="R$/m² Médio" value={fmt(result.avg_price_per_sqm)} icon={Home} />
            <MetricCard title="Sugestão Anúncio" value={fmt(result.suggested_ad_price)} icon={TrendingUp} />
            <MetricCard title="Venda Rápida" value={fmt(result.suggested_fast_sale_price)} icon={BarChart3} />
          </div>

          {/* Price Range Gauge */}
          {result.price_range_min && result.price_range_max && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Faixa de Preço</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceRangeGauge
                  min={Number(result.price_range_min)}
                  max={Number(result.price_range_max)}
                  fastSale={Number(result.suggested_fast_sale_price)}
                  market={Number(result.suggested_market_price)}
                  adPrice={Number(result.suggested_ad_price)}
                  ownerExpected={subject?.owner_expected_price ? Number(subject.owner_expected_price) : null}
                />
              </CardContent>
            </Card>
          )}

          {/* Market Insights */}
          {displayInsights.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Insights de Mercado
                {aiInsights && aiInsights.length > 0 && (
                  <Badge variant="secondary" className="text-xs">IA</Badge>
                )}
              </h2>
              <MarketInsights insights={displayInsights} />
            </div>
          )}

          {/* Executive Summary */}
          {result.executive_summary && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo Executivo
                  <Badge variant="secondary" className="text-xs">IA</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">{result.executive_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Justification */}
          {result.justification && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Justificativa Técnica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">{result.justification}</p>
              </CardContent>
            </Card>
          )}

          {/* Research Transparency */}
          {result.research_metadata && (() => {
            const meta = result.research_metadata as any;
            return (
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Transparência da Pesquisa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Search className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Encontrados</p>
                        <p className="font-semibold">{meta.total_listings_found || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Abertos</p>
                        <p className="font-semibold">{meta.listings_opened || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Descartados</p>
                        <p className="font-semibold">{meta.listings_discarded || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Coletado em</p>
                        <p className="font-semibold text-xs">
                          {meta.collected_at ? new Date(meta.collected_at).toLocaleString("pt-BR") : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Portals checked */}
                  {meta.portals_checked && meta.portals_checked.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Portais pesquisados</p>
                      <div className="flex flex-wrap gap-2">
                        {meta.portals_checked.map((p: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {p.portal_name}: {p.urls_found} encontrados, {p.urls_valid || 0} válidos
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discard reasons */}
                  {meta.discard_reasons && meta.discard_reasons.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Motivos de descarte</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {meta.discard_reasons.map((d: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <XCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">
                              <span className="font-medium">{d.portal}:</span> {d.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Limitations */}
                  {meta.limitations && meta.limitations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                        Limitações
                      </p>
                      <ul className="space-y-1">
                        {meta.limitations.map((l: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground">• {l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}


          {approvedComparables.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    R$/m² por Comparável
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PricePerSqmChart comparables={approvedComparables} avgPricePerSqm={result.avg_price_per_sqm ? Number(result.avg_price_per_sqm) : undefined} />
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ScatterChart className="h-5 w-5" />
                    Área vs Preço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MarketScatterChart
                    comparables={approvedComparables.map((c: any): ComparableChartData => ({
                      title: c.title || c.address || "Comp.",
                      price: Number(c.price) || 0,
                      area: Number(c.area) || 0,
                      price_per_sqm: Number(c.price_per_sqm) || 0,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>
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

      {/* Comparables Table */}
      {comparables.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
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
                    <th className="text-center py-2 px-2">Fonte</th>
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
                                  <AdjustmentBadge key={a.id} direction={a.direction} percentage={Number(a.percentage)} label={a.label} />
                                ))
                              : <span className="text-xs text-muted-foreground">—</span>}
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
                        <td className="text-center py-2 px-2">
                          {c.source_url ? (
                            <a
                              href={c.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              {c.source_name || "Link"}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">{c.source_name || "—"}</span>
                          )}
                        </td>
                        <td className="text-center py-2 pl-2">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleApproval.mutate({ compId: c.id, approved: !c.is_approved })}
                            >
                              {c.is_approved
                                ? <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" />
                                : <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteTarget(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir comparável"
        description="Tem certeza que deseja excluir este comparável? Utilize o botão Recalcular para atualizar os cenários."
        onConfirm={() => deleteTarget && deleteComparable.mutate(deleteTarget)}
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}

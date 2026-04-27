import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { SubjectPropertyForm, SubjectPropertyData } from "@/components/market-study/SubjectPropertyForm";
import { ComparableReviewModal, ComparableFormData } from "@/components/market-study/ComparableReviewModal";
import { EditComparableUrlDialog } from "@/components/market-study/EditComparableUrlDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { calculateManualAnalysis, detectPortalFromUrl } from "@/hooks/useManualMarketAnalysis";
import { validateListingUrl } from "@/lib/validateListingUrl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Pencil, ExternalLink, Link as LinkIcon,
  AlertTriangle, Sparkles, Loader2, Check, Info,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Imóvel avaliado" },
  { label: "Links" },
  { label: "Revisão" },
  { label: "Análise" },
  { label: "Relatório IA" },
];

const emptySubject: SubjectPropertyData = {
  purpose: "venda",
  property_type: "",
  property_category: "",
  address: "", neighborhood: "", condominium: "", city: "", state: "", cep: "",
  area_land: undefined, area_built: undefined, area_useful: undefined,
  bedrooms: undefined, suites: undefined, bathrooms: undefined,
  parking_spots: undefined, living_rooms: undefined, powder_rooms: undefined,
  property_age: "", construction_standard: "", conservation_state: "",
  differentials: [],
  condominium_fee: undefined, iptu: undefined,
  observations: "", pricing_objective: "venda", owner_expected_price: undefined,
};

interface ComparableRow extends ComparableFormData {
  // Always have an id once persisted
  id: string;
}

export default function NewMarketStudy() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [studyId, setStudyId] = useState<string | null>(null);
  const [subject, setSubject] = useState<SubjectPropertyData>(emptySubject);
  const [comparables, setComparables] = useState<ComparableRow[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [reviewing, setReviewing] = useState<ComparableRow | null>(null);
  const [editingUrl, setEditingUrl] = useState<ComparableRow | null>(null);
  const [removing, setRemoving] = useState<ComparableRow | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);
  const [aiReport, setAiReport] = useState<{ executive_summary?: string; justification?: string; insights?: any[] } | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);

  const subjectArea = subject.area_useful || subject.area_built || subject.area_land || 0;
  const analysis = useMemo(
    () => calculateManualAnalysis(comparables, subjectArea, subject.owner_expected_price),
    [comparables, subjectArea, subject.owner_expected_price],
  );

  const hasInvalidUrl = comparables.some((c) => !validateListingUrl(c.source_url).valid);

  const canAdvance = () => {
    if (step === 0) return !!subject.property_category && !!subject.neighborhood && !!subject.city;
    if (step === 1) return comparables.length >= 1 && !hasInvalidUrl;
    if (step === 2) return analysis.used_count >= 1;
    return true;
  };

  // ---------- Step 0: create study + subject ----------
  const handleSaveSubject = async (): Promise<string | null> => {
    if (!user || !profile?.tenant_id) {
      toast.error("Sessão inválida");
      return null;
    }
    setSavingSubject(true);
    try {
      let id = studyId;
      if (!id) {
        const { data: created, error } = await supabase
          .from("market_studies")
          .insert({
            tenant_id: profile.tenant_id,
            broker_id: user.id,
            title: `${subject.property_category || "Imóvel"} — ${subject.neighborhood}, ${subject.city}`,
            purpose: subject.purpose,
            status: "draft",
          })
          .select("id")
          .single();
        if (error || !created) throw error || new Error("Erro ao criar estudo");
        id = created.id;
        setStudyId(id);
      }

      const subjectPayload = {
        market_study_id: id,
        purpose: subject.purpose,
        property_type: subject.property_type || null,
        property_category: subject.property_category || null,
        address: subject.address || null,
        neighborhood: subject.neighborhood || null,
        condominium: subject.condominium || null,
        city: subject.city || null,
        state: subject.state || null,
        cep: subject.cep || null,
        area_land: subject.area_land ?? null,
        area_built: subject.area_built ?? null,
        area_useful: subject.area_useful ?? null,
        bedrooms: subject.bedrooms ?? null,
        suites: subject.suites ?? null,
        bathrooms: subject.bathrooms ?? null,
        parking_spots: subject.parking_spots ?? null,
        living_rooms: subject.living_rooms ?? null,
        powder_rooms: subject.powder_rooms ?? null,
        property_age: subject.property_age || null,
        construction_standard: subject.construction_standard || null,
        conservation_state: subject.conservation_state || null,
        differentials: subject.differentials,
        condominium_fee: subject.condominium_fee ?? null,
        iptu: subject.iptu ?? null,
        observations: subject.observations || null,
        pricing_objective: subject.pricing_objective || null,
        owner_expected_price: subject.owner_expected_price ?? null,
      };

      // Upsert: delete existing then insert (safer for first iteration)
      await supabase.from("market_study_subject_properties").delete().eq("market_study_id", id);
      const { error: subjErr } = await supabase
        .from("market_study_subject_properties")
        .insert(subjectPayload);
      if (subjErr) throw subjErr;

      return id;
    } catch (err: any) {
      toast.error("Erro ao salvar imóvel: " + (err.message || "erro"));
      return null;
    } finally {
      setSavingSubject(false);
    }
  };

  // ---------- Step 1: add comparable link ----------
  const handleAddLink = async () => {
    const url = newUrl.trim();
    if (!url) {
      toast.error("Cole um link de anúncio");
      return;
    }
    if (!studyId) {
      toast.error("Salve o imóvel principal primeiro");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Link inválido");
      return;
    }
    if (comparables.some((c) => c.source_url === url)) {
      toast.error("Esse link já foi adicionado");
      return;
    }

    const portal = detectPortalFromUrl(url);
    const { data, error } = await supabase
      .from("market_study_comparables")
      .insert({
        market_study_id: studyId,
        origin: "manual",
        source_url: url,
        source_name: portal,
        is_approved: true,
      })
      .select("*")
      .single();

    if (error || !data) {
      toast.error("Erro ao adicionar comparável");
      return;
    }
    setComparables((prev) => [...prev, { id: data.id, source_url: url, source_name: portal }]);
    setNewUrl("");
    toast.success("Link adicionado. Clique em Revisar para preencher os dados.");
  };

  const handleRemoveComparable = async (id: string) => {
    await supabase.from("market_study_comparables").delete().eq("id", id);
    setComparables((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveReview = async (data: ComparableFormData) => {
    if (!data.id) return;
    const pricePerSqm =
      data.price && data.area && Number(data.area) > 0
        ? Math.round(Number(data.price) / Number(data.area))
        : null;
    const { error } = await supabase
      .from("market_study_comparables")
      .update({
        title: data.title || null,
        property_type: data.property_type || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        area: data.area ?? null,
        bedrooms: data.bedrooms ?? null,
        suites: data.suites ?? null,
        bathrooms: data.bathrooms ?? null,
        parking_spots: data.parking_spots ?? null,
        price: data.price ?? null,
        condominium_fee: data.condominium_fee ?? null,
        iptu: data.iptu ?? null,
        conservation_state: data.conservation_state || null,
        notes: data.notes || null,
        price_per_sqm: pricePerSqm,
      })
      .eq("id", data.id);
    if (error) {
      toast.error("Erro ao salvar comparável");
      return;
    }
    setComparables((prev) => prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
    toast.success("Comparável atualizado");
  };

  // ---------- Step 3: persist results ----------
  const persistResults = async () => {
    if (!studyId) return;
    await supabase.from("market_study_results").delete().eq("market_study_id", studyId);
    await supabase.from("market_study_results").insert({
      market_study_id: studyId,
      avg_price: analysis.suggested_market_price,
      median_price: Math.round(analysis.median_price_per_sqm * (subjectArea || 0)),
      avg_price_per_sqm: analysis.avg_price_per_sqm,
      suggested_market_price: analysis.suggested_market_price,
      suggested_fast_sale_price: analysis.suggested_fast_sale_price,
      suggested_ad_price: analysis.suggested_aspirational_price,
      price_range_min: analysis.conservative_min,
      price_range_max: analysis.aggressive_max,
      confidence_level: analysis.confidence_level,
    });
    await supabase
      .from("market_studies")
      .update({ status: "completed", current_phase: null, updated_at: new Date().toISOString() } as any)
      .eq("id", studyId);
  };

  // ---------- Step 4: AI report ----------
  const handleGenerateAI = async () => {
    if (!studyId) return;
    setGeneratingAI(true);
    try {
      await persistResults();
      const validComps = comparables.filter(
        (c) => c.price && c.area && Number(c.area) > 0,
      );
      const { data, error } = await supabase.functions.invoke("generate-market-summary", {
        body: {
          subject: {
            ...subject,
            area_useful: subject.area_useful,
          },
          comparables: validComps.map((c) => ({
            title: c.title,
            address: c.neighborhood,
            price: c.price,
            adjusted_price: c.price,
            area: c.area,
            similarity_score: 0,
          })),
          result: {
            avg_price: analysis.suggested_market_price,
            avg_price_per_sqm: analysis.avg_price_per_sqm,
            suggested_ad_price: analysis.suggested_aspirational_price,
            suggested_market_price: analysis.suggested_market_price,
            suggested_fast_sale_price: analysis.suggested_fast_sale_price,
            price_range_min: analysis.conservative_min,
            price_range_max: analysis.aggressive_max,
            confidence_level: analysis.confidence_level,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiReport(data);

      const { data: existing } = await supabase
        .from("market_study_results")
        .select("id")
        .eq("market_study_id", studyId)
        .single();
      if (existing) {
        await supabase
          .from("market_study_results")
          .update({
            executive_summary: data.executive_summary,
            justification: data.justification,
            market_insights: data.insights,
          })
          .eq("id", existing.id);
      }
      toast.success("Relatório gerado!");
    } catch (err: any) {
      toast.error("Erro ao gerar relatório: " + (err.message || "erro"));
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleFinish = async () => {
    setSavingFinal(true);
    try {
      await persistResults();
      toast.success("Análise salva!");
      navigate(`/market-studies/${studyId}`);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "erro"));
    } finally {
      setSavingFinal(false);
    }
  };

  const next = async () => {
    if (step === 0) {
      const id = await handleSaveSubject();
      if (!id) return;
    }
    if (step === 2) {
      await persistResults();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const incompleteCount = comparables.filter(
    (c) => !c.price || !c.area || Number(c.area) <= 0,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Nova Análise de Mercado</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análise baseada em anúncios comparáveis informados manualmente.
        </p>
      </div>

      <WizardStepper steps={STEPS} currentStep={step} />

      {/* ========== Step 0 ========== */}
      {step === 0 && (
        <SubjectPropertyForm data={subject} onChange={setSubject} />
      )}

      {/* ========== Step 1 ========== */}
      {step === 1 && (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Adicionar comparáveis manualmente</AlertTitle>
            <AlertDescription>
              Esta análise é baseada em anúncios comparáveis que você informa manualmente. Não fazemos coleta automática em portais.
            </AlertDescription>
          </Alert>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Cole o link do anúncio</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://www.vivareal.com.br/imovel/..."
                onKeyDown={(e) => { if (e.key === "Enter") handleAddLink(); }}
              />
              <Button onClick={handleAddLink} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Adicionar comparável
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">
                Comparáveis adicionados ({comparables.length})
                {incompleteCount > 0 && (
                  <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">
                    {incompleteCount} incompleto{incompleteCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comparables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum link adicionado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {comparables.map((c) => {
                    const incomplete = !c.price || !c.area || Number(c.area) <= 0;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          incomplete ? "border-amber-500/40 bg-amber-500/5" : "border-border"
                        }`}
                      >
                        <Badge variant="secondary" className="shrink-0">{c.source_name}</Badge>
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate flex-1 flex items-center gap-1"
                        >
                          {c.title || c.source_url} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        {incomplete ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600 shrink-0">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Faltam dados
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500 text-emerald-600 shrink-0">
                            <Check className="h-3 w-3 mr-1" /> Completo
                          </Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setReviewing(c)}>
                          <Pencil className="h-3 w-3 mr-1" /> Revisar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveComparable(c.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {reviewing && (
            <ComparableReviewModal
              open={!!reviewing}
              onOpenChange={(o) => !o && setReviewing(null)}
              initial={reviewing}
              onSave={handleSaveReview}
            />
          )}
        </div>
      )}

      {/* ========== Step 2: Review (same UI but emphasized) ========== */}
      {step === 2 && (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Revise os dados de cada comparável</AlertTitle>
            <AlertDescription>
              Comparáveis sem preço ou metragem não entrarão nos cálculos. Edite-os agora para incluí-los na análise.
            </AlertDescription>
          </Alert>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {comparables.map((c) => {
                  const incomplete = !c.price || !c.area || Number(c.area) <= 0;
                  const ppsqm = !incomplete ? Math.round(Number(c.price) / Number(c.area)) : null;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        incomplete ? "border-amber-500/40 bg-amber-500/5" : "border-border"
                      }`}
                    >
                      <Badge variant="secondary" className="shrink-0">{c.source_name}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.title || c.source_url}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.area ? `${c.area} m²` : "—"} · {c.price ? `R$ ${Number(c.price).toLocaleString("pt-BR")}` : "sem preço"}
                          {ppsqm && ` · R$ ${ppsqm.toLocaleString("pt-BR")}/m²`}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setReviewing(c)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {reviewing && (
            <ComparableReviewModal
              open={!!reviewing}
              onOpenChange={(o) => !o && setReviewing(null)}
              initial={reviewing}
              onSave={handleSaveReview}
            />
          )}
        </div>
      )}

      {/* ========== Step 3: Analysis ========== */}
      {step === 3 && <AnalysisStep analysis={analysis} subjectArea={subjectArea} ownerPrice={subject.owner_expected_price} />}

      {/* ========== Step 4: AI report ========== */}
      {step === 4 && (
        <div className="space-y-4">
          {!aiReport ? (
            <Card className="glass-card">
              <CardContent className="py-10 flex flex-col items-center text-center gap-4">
                <Sparkles className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Gerar relatório com IA</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    A IA usará apenas os dados do imóvel principal e dos comparáveis preenchidos para gerar o parecer.
                  </p>
                </div>
                <Button onClick={handleGenerateAI} disabled={generatingAI} className="gap-2">
                  {generatingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generatingAI ? "Gerando..." : "Gerar relatório"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="glass-card">
                <CardHeader><CardTitle>Resumo executivo</CardTitle></CardHeader>
                <CardContent className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
                  {aiReport.executive_summary}
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle>Justificativa</CardTitle></CardHeader>
                <CardContent className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
                  {aiReport.justification}
                </CardContent>
              </Card>
              {aiReport.insights && aiReport.insights.length > 0 && (
                <Card className="glass-card">
                  <CardHeader><CardTitle>Insights</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {aiReport.insights.map((ins: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border border-border">
                        <p className="font-medium text-sm">{ins.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ins.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ========== Wizard nav ========== */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prev} disabled={step === 0 || savingSubject} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canAdvance() || savingSubject} className="gap-1">
            {savingSubject ? <Loader2 className="h-4 w-4 animate-spin" /> : "Avançar"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={savingFinal} className="gap-1">
            {savingFinal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Concluir"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============== Analysis step ==============
function AnalysisStep({
  analysis,
  subjectArea,
  ownerPrice,
}: {
  analysis: ReturnType<typeof calculateManualAnalysis>;
  subjectArea: number;
  ownerPrice: number | null | undefined;
}) {
  const fmt = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
  return (
    <div className="space-y-4">
      {analysis.warning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>{analysis.warning}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricBox label="Comparáveis usados" value={`${analysis.used_count}/${analysis.total_count}`} />
        <MetricBox label="R$/m² médio" value={fmt(analysis.avg_price_per_sqm)} />
        <MetricBox label="R$/m² mediano" value={fmt(analysis.median_price_per_sqm)} />
        <MetricBox label="R$/m² mín–máx" value={`${fmt(analysis.min_price_per_sqm)} – ${fmt(analysis.max_price_per_sqm)}`} />
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Faixas sugeridas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <RangeRow label="Conservadora" min={analysis.conservative_min} max={analysis.conservative_max} tone="muted" />
          <RangeRow label="Média" min={analysis.average_min} max={analysis.average_max} tone="primary" />
          <RangeRow label="Agressiva" min={analysis.aggressive_min} max={analysis.aggressive_max} tone="muted" />
          <p className="text-xs text-muted-foreground pt-2">
            Calculado sobre área de referência: {subjectArea > 0 ? `${subjectArea} m²` : "(área não informada)"}
          </p>
        </CardContent>
      </Card>

      {ownerPrice ? (
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg">Comparativo com pedido do proprietário</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricBox label="Pedido do proprietário" value={fmt(Number(ownerPrice))} />
            <MetricBox label="Sugestão de mercado" value={fmt(analysis.suggested_market_price)} />
            <MetricBox
              label="Diferença"
              value={
                analysis.diff_vs_owner != null
                  ? `${analysis.diff_vs_owner > 0 ? "+" : ""}${fmt(analysis.diff_vs_owner)} (${analysis.diff_vs_owner_pct?.toFixed(1)}%)`
                  : "—"
              }
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 bg-card/50">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function RangeRow({ label, min, max, tone }: { label: string; min: number; max: number; tone: "muted" | "primary" }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${tone === "primary" ? "bg-primary/10 border border-primary/30" : "bg-muted/30"}`}>
      <span className="font-medium text-sm">{label}</span>
      <span className="font-semibold">
        R$ {Math.round(min).toLocaleString("pt-BR")} – R$ {Math.round(max).toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

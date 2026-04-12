import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generatePresentationSections } from "@/hooks/useGeneratePresentation";
import { calculateMarketPrices } from "@/hooks/useMarketCalculations";
import { scoredComparables } from "@/hooks/useMarketSimilarity";
import { calculateAllAdjustments, calculateMarketResult } from "@/hooks/useMarketAdjustments";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { StepPropertyData, PropertyData } from "@/components/wizard/StepPropertyData";
import { StepLayoutStyle, LayoutStyleData } from "@/components/wizard/StepLayoutStyle";
import { StepMarketStudy, MarketStudyData } from "@/components/wizard/StepMarketStudy";
import { StepGeneration } from "@/components/wizard/StepGeneration";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Imóvel" },
  { label: "Layout" },
  { label: "Mercado" },
  { label: "Geração" },
];

const emptyProperty: PropertyData = {
  title: "", owner_name: "", property_type: "", property_purpose: "",
  address: "", city: "", neighborhood: "", condominium: "", cep: "",
  area_total: "", area_built: "", area_land: "", bedrooms: "", suites: "",
  bathrooms: "", parking_spots: "", property_standard: "", property_age: "",
  highlights: "", owner_expected_price: "", notes: "", photos: [],
};

const emptyLayout: LayoutStyleData = { layout: "executivo", tone: "executivo", mode: "automatico" };

const emptyMarket: MarketStudyData = {
  selectedPortals: [], searchRadius: "2km", minArea: "", maxArea: "",
  minPrice: "", maxPrice: "", maxComparables: "10",
};

export default function AgentNewPresentation() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [propertyData, setPropertyData] = useState<PropertyData>(emptyProperty);
  const [layoutData, setLayoutData] = useState<LayoutStyleData>(emptyLayout);
  const [marketData, setMarketData] = useState<MarketStudyData>(emptyMarket);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(null);

  const canAdvance = () => {
    if (step === 0) return !!propertyData.title;
    if (step === 1) return !!layoutData.layout;
    return true;
  };

  const handleGenerate = async () => {
    if (!user || !profile?.tenant_id) { toast.error("Dados de sessão não disponíveis"); return; }

    setIsGenerating(true);
    try {
      // Create presentation
      const { data: pres, error: presError } = await supabase.from("presentations").insert({
        tenant_id: profile.tenant_id,
        broker_id: user.id,
        title: propertyData.title || "Nova Apresentação",
        owner_name: propertyData.owner_name || null,
        property_type: propertyData.property_type || null,
        property_purpose: propertyData.property_purpose || null,
        address: propertyData.address || null,
        city: propertyData.city || null,
        neighborhood: propertyData.neighborhood || null,
        condominium: propertyData.condominium || null,
        cep: propertyData.cep || null,
        area_total: propertyData.area_total ? Number(propertyData.area_total) : null,
        area_built: propertyData.area_built ? Number(propertyData.area_built) : null,
        area_land: propertyData.area_land ? Number(propertyData.area_land) : null,
        bedrooms: propertyData.bedrooms ? Number(propertyData.bedrooms) : null,
        suites: propertyData.suites ? Number(propertyData.suites) : null,
        bathrooms: propertyData.bathrooms ? Number(propertyData.bathrooms) : null,
        parking_spots: propertyData.parking_spots ? Number(propertyData.parking_spots) : null,
        property_standard: propertyData.property_standard || null,
        property_age: propertyData.property_age || null,
        highlights: propertyData.highlights || null,
        owner_expected_price: propertyData.owner_expected_price ? Number(propertyData.owner_expected_price) : null,
        notes: propertyData.notes || null,
        selected_layout: layoutData.layout,
        selected_tone: layoutData.tone,
        creation_mode: layoutData.mode,
        share_token: crypto.randomUUID(),
        status: "draft",
      }).select().single();

      if (presError || !pres) throw presError || new Error("Erro ao criar apresentação");

      // === Market analysis (isolated — never blocks presentation generation) ===
      let marketReport: any = null;
      let generatedComparables: any[] = [];
      let marketCalc: any = null;

      try {
        const photosPromise = propertyData.photos.length > 0
          ? supabase.from("presentation_images").insert(
              propertyData.photos.map((url, i) => ({ presentation_id: pres.id, image_url: url, sort_order: i }))
            ).then(() => null)
          : Promise.resolve(null);

        const portalSourcesPromise = marketData.selectedPortals.length > 0
          ? Promise.resolve(supabase.from("portal_sources").select("id, name, code").in("id", marketData.selectedPortals))
          : Promise.resolve(null);

        const [, portalSourcesRes] = await Promise.all([photosPromise, portalSourcesPromise]);

        if (marketData.selectedPortals.length > 0) {
          const { data: job, error: jobError } = await supabase.from("market_analysis_jobs").insert({
            presentation_id: pres.id,
            tenant_id: profile.tenant_id,
            selected_portals: marketData.selectedPortals as any,
            filters: {
              searchRadius: marketData.searchRadius,
              minArea: marketData.minArea,
              maxArea: marketData.maxArea,
              minPrice: marketData.minPrice,
              maxPrice: marketData.maxPrice,
              maxComparables: marketData.maxComparables,
            } as any,
            status: "pending",
            started_at: new Date().toISOString(),
          }).select().single();

          if (job && !jobError) {
            const portals = (portalSourcesRes?.data || []).map((p: any) => ({ id: p.id, name: p.name, code: p.code }));

            const analyzeBody = {
              property: propertyData,
              portals,
              filters: {
                searchRadius: marketData.searchRadius,
                minArea: marketData.minArea,
                maxArea: marketData.maxArea,
                minPrice: marketData.minPrice,
                maxPrice: marketData.maxPrice,
                maxComparables: marketData.maxComparables,
              },
            };

            let scrapedComparables: any[] = [];

            try {
              console.log("Trying Manus AI for market analysis...");
              const { data: manusResult, error: manusError } = await supabase.functions.invoke("analyze-market-manus", {
                body: analyzeBody,
              });

              if (!manusError && manusResult?.success && manusResult?.comparables?.length) {
                console.log(`Manus returned ${manusResult.comparables.length} comparables`);
                scrapedComparables = manusResult.comparables;
              } else {
                console.warn("Manus failed, trying Firecrawl...", manusError || manusResult?.message);

                const { data: analyzeResult, error: analyzeError } = await supabase.functions.invoke("analyze-market", {
                  body: analyzeBody,
                });

                if (!analyzeError && analyzeResult?.success && analyzeResult?.comparables?.length) {
                  console.log(`Firecrawl returned ${analyzeResult.comparables.length} comparables`);
                  scrapedComparables = analyzeResult.comparables;
                } else {
                  console.warn("Firecrawl also failed. No market data available.", analyzeError || analyzeResult?.message);
                  toast.warning("Não foi possível buscar comparáveis nos portais. O estudo de mercado ficará sem dados.");
                }
              }
            } catch (err) {
              console.error("Market analysis error:", err);
              toast.warning("Erro ao buscar comparáveis nos portais.");
            }

            // Save comparables to market_comparables for the job
            generatedComparables = scrapedComparables.map((c: any) => ({
              market_analysis_job_id: job.id,
              ...c,
            }));

            // Build subject for scoring (used by study + AI summary)
            const subjectForScoring = {
              condominium: propertyData.condominium || null,
              neighborhood: propertyData.neighborhood || null,
              city: propertyData.city || null,
              property_type: propertyData.property_type || null,
              area_useful: propertyData.area_total ? Number(propertyData.area_total) : null,
              area_built: propertyData.area_built ? Number(propertyData.area_built) : null,
              area_land: propertyData.area_land ? Number(propertyData.area_land) : null,
              bedrooms: propertyData.bedrooms ? Number(propertyData.bedrooms) : null,
              suites: propertyData.suites ? Number(propertyData.suites) : null,
              parking_spots: propertyData.parking_spots ? Number(propertyData.parking_spots) : null,
              construction_standard: propertyData.property_standard || null,
              owner_expected_price: propertyData.owner_expected_price ? Number(propertyData.owner_expected_price) : null,
            };

            if (generatedComparables.length > 0) {
              marketCalc = calculateMarketPrices(generatedComparables.map(c => ({
                price: c.price,
                price_per_sqm: c.price_per_sqm,
                is_approved: c.is_approved ?? true,
              })));

              const summaryText = `Análise baseada em ${generatedComparables.length} comparáveis reais extraídos de portais.`;

              const [, reportRes] = await Promise.all([
                supabase.from("market_comparables").insert(generatedComparables),
                supabase.from("market_reports").insert({
                  market_analysis_job_id: job.id,
                  avg_price: marketCalc.avg_price,
                  median_price: marketCalc.median_price,
                  avg_price_per_sqm: marketCalc.avg_price_per_sqm,
                  suggested_market_price: marketCalc.suggested_market_price,
                  suggested_aspirational_price: marketCalc.suggested_aspirational_price,
                  suggested_fast_sale_price: marketCalc.suggested_fast_sale_price,
                  confidence_level: "medium",
                  summary: summaryText,
                }).select().single(),
                supabase.from("market_analysis_jobs").update({
                  status: "completed",
                  finished_at: new Date().toISOString(),
                }).eq("id", job.id),
              ]);

              marketReport = reportRes?.data;
            } else {
              // No comparables — mark job as failed
              await supabase.from("market_analysis_jobs").update({
                status: "failed",
                finished_at: new Date().toISOString(),
              }).eq("id", job.id);
            }

            // === Create Market Study (unified) — always created when portals selected ===
            try {
              const { data: study } = await supabase.from("market_studies").insert({
                broker_id: user.id,
                tenant_id: profile.tenant_id,
                title: propertyData.title || "Estudo de Mercado",
                purpose: propertyData.property_purpose || "venda",
                status: "completed",
              }).select().single();

              if (study) {
                // Save subject property
                await supabase.from("market_study_subject_properties").insert({
                  market_study_id: study.id,
                  property_type: propertyData.property_type || null,
                  property_category: propertyData.property_type || null,
                  address: propertyData.address || null,
                  neighborhood: propertyData.neighborhood || null,
                  city: propertyData.city || null,
                  condominium: propertyData.condominium || null,
                  cep: propertyData.cep || null,
                  area_useful: propertyData.area_total ? Number(propertyData.area_total) : null,
                  area_built: propertyData.area_built ? Number(propertyData.area_built) : null,
                  area_land: propertyData.area_land ? Number(propertyData.area_land) : null,
                  bedrooms: propertyData.bedrooms ? Number(propertyData.bedrooms) : null,
                  suites: propertyData.suites ? Number(propertyData.suites) : null,
                  bathrooms: propertyData.bathrooms ? Number(propertyData.bathrooms) : null,
                  parking_spots: propertyData.parking_spots ? Number(propertyData.parking_spots) : null,
                  construction_standard: propertyData.property_standard || null,
                  property_age: propertyData.property_age || null,
                  owner_expected_price: propertyData.owner_expected_price ? Number(propertyData.owner_expected_price) : null,
                  purpose: propertyData.property_purpose || "venda",
                });

                if (scrapedComparables.length > 0) {
                  // Score comparables
                  const scored = scoredComparables(subjectForScoring, scrapedComparables.map((c: any, i: number) => ({
                    id: `temp-${i}`,
                    ...c,
                  })), undefined, 0);

                  // Save study comparables
                  const studyComparables = scored.map((c: any) => ({
                    market_study_id: study.id,
                    title: c.title || null,
                    address: c.address || null,
                    neighborhood: c.neighborhood || null,
                    city: c.city || null,
                    condominium: c.condominium || null,
                    property_type: c.property_type || null,
                    price: c.price || null,
                    area: c.area || null,
                    price_per_sqm: c.price_per_sqm || null,
                    bedrooms: c.bedrooms || null,
                    suites: c.suites || null,
                    parking_spots: c.parking_spots || null,
                    similarity_score: c.similarity_score || 0,
                    source_name: c.source_name || null,
                    source_url: c.source_url || null,
                    is_approved: true,
                  }));

                  const { data: insertedComps } = await supabase
                    .from("market_study_comparables")
                    .insert(studyComparables)
                    .select();

                  // Calculate adjustments and results
                  if (insertedComps && insertedComps.length > 0) {
                    const adjustedComps = calculateAllAdjustments(subjectForScoring, insertedComps.map((c: any) => ({
                      id: c.id,
                      price: c.price,
                      suites: c.suites,
                      parking_spots: c.parking_spots,
                      conservation_state: c.conservation_state,
                      construction_standard: c.construction_standard,
                      area: c.area,
                      differentials: c.differentials,
                    })));

                    // Save adjustments
                    const allAdjustments = adjustedComps.flatMap(ac =>
                      ac.adjustments.map(a => ({
                        comparable_id: ac.comparable_id,
                        adjustment_type: a.adjustment_type,
                        label: a.label,
                        percentage: a.percentage,
                        value: a.value,
                        direction: a.direction,
                      }))
                    );

                    if (allAdjustments.length > 0) {
                      await supabase.from("market_study_adjustments").insert(allAdjustments);
                    }

                    // Update adjusted prices
                    await Promise.all(adjustedComps.map(ac =>
                      supabase.from("market_study_comparables")
                        .update({ adjusted_price: ac.adjusted_price })
                        .eq("id", ac.comparable_id)
                    ));

                    // Calculate market result
                    const result = calculateMarketResult(adjustedComps);
                    const avgPriceSqm = insertedComps
                      .filter((c: any) => c.price_per_sqm && c.price_per_sqm > 0)
                      .reduce((sum: number, c: any, _: number, arr: any[]) => sum + (c.price_per_sqm / arr.length), 0);

                    const summaryText = `Análise baseada em ${insertedComps.length} comparáveis reais extraídos de portais.`;

                    await supabase.from("market_study_results").insert({
                      market_study_id: study.id,
                      avg_price: result.avg_price,
                      median_price: result.median_price,
                      avg_price_per_sqm: Math.round(avgPriceSqm),
                      suggested_ad_price: result.suggested_ad_price,
                      suggested_market_price: result.suggested_market_price,
                      suggested_fast_sale_price: result.suggested_fast_sale_price,
                      price_range_min: result.price_range_min,
                      price_range_max: result.price_range_max,
                      confidence_level: "medium",
                      executive_summary: summaryText,
                    });

                    // Generate AI summary (non-blocking)
                    try {
                      const { data: aiSummary } = await supabase.functions.invoke("generate-market-summary", {
                        body: {
                          subject: subjectForScoring,
                          comparables: studyComparables,
                          result: { ...result, avg_price_per_sqm: Math.round(avgPriceSqm) },
                        },
                      });

                      if (aiSummary?.executive_summary) {
                        await supabase.from("market_study_results")
                          .update({
                            executive_summary: aiSummary.executive_summary,
                            justification: aiSummary.justification,
                            market_insights: aiSummary.market_insights,
                          })
                          .eq("market_study_id", study.id);
                      }
                    } catch (aiErr) {
                      console.warn("AI summary generation failed (non-fatal):", aiErr);
                    }
                  }
                }
              }
            } catch (studyErr) {
              console.error("Market study creation failed (non-fatal):", studyErr);
            }
          }
        }
      } catch (marketErr: any) {
        console.error("Market analysis block failed (non-fatal):", marketErr);
      }

      // === Presentation generation — ALWAYS runs ===
      setCreatedId(pres.id);
      createdIdRef.current = pres.id;

      await generatePresentationSections({
        presentationId: pres.id,
        tenantId: profile.tenant_id,
        brokerId: user.id,
      });

      if (marketReport && marketCalc) {
        const chartComparables = generatedComparables.map((c: any) => ({
          title: c.title, price: c.price, area: c.area, price_per_sqm: c.price_per_sqm,
        }));

        await Promise.all([
          supabase.from("presentation_sections")
            .update({
              content: {
                owner_expected_price: propertyData.owner_expected_price ? Number(propertyData.owner_expected_price) : null,
                scenarios: [
                  { label: "Preço aspiracional", value: marketReport.suggested_aspirational_price },
                  { label: "Preço de mercado", value: marketReport.suggested_market_price },
                  { label: "Preço de venda rápida", value: marketReport.suggested_fast_sale_price },
                ],
              } as any,
            })
            .eq("presentation_id", pres.id)
            .eq("section_key", "pricing_scenarios"),
          supabase.from("presentation_sections")
            .update({
              content: {
                comparables: chartComparables,
                owner_expected_price: propertyData.owner_expected_price ? Number(propertyData.owner_expected_price) : null,
                avg_price: marketCalc?.avg_price,
                median_price: marketCalc?.median_price,
                avg_price_per_sqm: marketCalc?.avg_price_per_sqm,
                status: "completed",
              } as any,
            })
            .eq("presentation_id", pres.id)
            .eq("section_key", "market_study_placeholder"),
        ]);
      }
    } catch (err: any) {
      toast.error("Erro ao gerar: " + (err.message || "erro desconhecido"));
      setIsGenerating(false);
      return;
    }
    setGenerationDone(true);
  };

  const handleAnimationDone = () => {
    setIsComplete(true);
    setTimeout(() => {
      if (createdIdRef.current) navigate(`/presentations/${createdIdRef.current}/edit`);
    }, 1500);
  };

  const handleNext = () => {
    if (step === 2) {
      setStep(3);
      handleGenerate();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Apresentação</h1>
        <p className="text-muted-foreground">Crie uma apresentação profissional de captação em poucos passos.</p>
      </div>

      <WizardStepper steps={STEPS} currentStep={step} />

      {step === 0 && <StepPropertyData data={propertyData} onChange={setPropertyData} />}
      {step === 1 && <StepLayoutStyle data={layoutData} onChange={setLayoutData} />}
      {step === 2 && <StepMarketStudy data={marketData} onChange={setMarketData} />}
      {step === 3 && <StepGeneration isGenerating={isGenerating} isComplete={isComplete} generationDone={generationDone} onAnimationDone={handleAnimationDone} />}

      {step < 3 && (
        <div className="flex justify-between max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : navigate("/dashboard")} >
            <ChevronLeft className="h-4 w-4 mr-1" /> {step > 0 ? "Anterior" : "Cancelar"}
          </Button>
          <Button onClick={handleNext} disabled={!canAdvance()}>
            {step === 2 ? "Gerar apresentação" : "Próximo"} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

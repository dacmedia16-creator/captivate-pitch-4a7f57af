import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generatePresentationSections } from "@/hooks/useGeneratePresentation";
import { generateSimulatedComparables } from "@/hooks/useSimulateComparables";
import { calculateMarketPrices } from "@/hooks/useMarketCalculations";
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

      // Save photos and market job in parallel
      let marketReport: any = null;
      let generatedComparables: any[] = [];
      let marketCalc: any = null;

      const photosPromise = propertyData.photos.length > 0
        ? supabase.from("presentation_images").insert(
            propertyData.photos.map((url, i) => ({ presentation_id: pres.id, image_url: url, sort_order: i }))
          ).then(() => null)
        : Promise.resolve(null);

      const portalSourcesPromise = marketData.selectedPortals.length > 0
        ? Promise.resolve(supabase.from("portal_sources").select("id, name, code").in("id", marketData.selectedPortals))
        : Promise.resolve(null);

      const [, portalSourcesRes] = await Promise.all([photosPromise, portalSourcesPromise]);

      // Market analysis
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

          // Try Manus first, then Firecrawl, then simulated
          let useSimulated = false;
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

          try {
            // Try Manus AI first
            console.log("Trying Manus AI for market analysis...");
            const { data: manusResult, error: manusError } = await supabase.functions.invoke("analyze-market-manus", {
              body: analyzeBody,
            });

            if (!manusError && manusResult?.success && manusResult?.comparables?.length) {
              console.log(`Manus returned ${manusResult.comparables.length} comparables`);
              generatedComparables = manusResult.comparables.map((c: any) => ({
                market_analysis_job_id: job.id,
                ...c,
              }));
            } else {
              console.warn("Manus failed or returned no results, trying Firecrawl...", manusError || manusResult?.message);

              // Fallback to Firecrawl
              const { data: analyzeResult, error: analyzeError } = await supabase.functions.invoke("analyze-market", {
                body: analyzeBody,
              });

              if (!analyzeError && analyzeResult?.success && analyzeResult?.comparables?.length) {
                console.log(`Firecrawl returned ${analyzeResult.comparables.length} comparables`);
                generatedComparables = analyzeResult.comparables.map((c: any) => ({
                  market_analysis_job_id: job.id,
                  ...c,
                }));
              } else {
                console.warn("Firecrawl also failed, using simulated:", analyzeError || analyzeResult?.message);
                useSimulated = true;
              }
            }
          } catch (err) {
            console.error("Market analysis error, falling back to simulated:", err);
            useSimulated = true;
          }

          // Fallback to simulated comparables
          if (useSimulated) {
            generatedComparables = generateSimulatedComparables(job.id, propertyData, portals);
          }

          marketCalc = calculateMarketPrices(generatedComparables.map(c => ({
            price: c.price,
            price_per_sqm: c.price_per_sqm,
            is_approved: c.is_approved,
          })));

          const confidenceLevel = useSimulated ? "low" : "medium";
          const summaryText = useSimulated
            ? `Análise baseada em ${generatedComparables.length} comparáveis simulados.`
            : `Análise baseada em ${generatedComparables.length} comparáveis reais extraídos de portais.`;

          // Insert comparables and report in parallel
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
              confidence_level: confidenceLevel,
              summary: summaryText,
            }).select().single(),
            supabase.from("market_analysis_jobs").update({
              status: "completed",
              finished_at: new Date().toISOString(),
            }).eq("id", job.id),
          ]);

          marketReport = reportRes?.data;
        }
      }

      setCreatedId(pres.id);
      createdIdRef.current = pres.id;

      // Generate sections
      await generatePresentationSections({
        presentationId: pres.id,
        tenantId: profile.tenant_id,
        brokerId: user.id,
      });

      // Update pricing_scenarios and market_study_placeholder sections in parallel
      if (marketReport) {
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
    }
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
      {step === 3 && <StepGeneration isGenerating={isGenerating} isComplete={isComplete} onAnimationDone={handleAnimationDone} />}

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

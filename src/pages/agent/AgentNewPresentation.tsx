import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generatePresentationSections } from "@/hooks/useGeneratePresentation";
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
  address: "", city: "", neighborhood: "", condominium: "", cep: "", state: "",
  area_total: "", area_built: "", area_land: "", area_useful: "",
  bedrooms: "", suites: "", bathrooms: "", parking_spots: "",
  living_rooms: "", powder_rooms: "",
  property_standard: "", property_age: "",
  construction_standard: "", conservation_state: "",
  differentials: [],
  condominium_fee: "", iptu: "", pricing_objective: "",
  highlights: "", owner_expected_price: "", notes: "", photos: [],
};

const emptyLayout: LayoutStyleData = { layout: "executivo", tone: "executivo", mode: "automatico" };

const emptyMarket: MarketStudyData = {
  selectedPortals: [], searchRadius: "2km", minArea: "", maxArea: "",
  minPrice: "", maxPrice: "", minComparables: "5", maxComparables: "20",
  preferSameCondominium: false, maxListingAgeMonths: "12",
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

      // Upload photos in parallel (non-blocking for section generation)
      if (propertyData.photos.length > 0) {
        await supabase.from("presentation_images").insert(
          propertyData.photos.map((url, i) => ({ presentation_id: pres.id, image_url: url, sort_order: i }))
        );
      }

      // === Generate presentation sections FIRST (fast, ~2-3s) ===
      setCreatedId(pres.id);
      createdIdRef.current = pres.id;

      await generatePresentationSections({
        presentationId: pres.id,
        tenantId: profile.tenant_id,
        brokerId: user.id,
      });

    } catch (err: any) {
      toast.error("Erro ao gerar: " + (err.message || "erro desconhecido"));
      setIsGenerating(false);
      return;
    }

    // Signal completion immediately — UI can redirect
    setGenerationDone(true);

    // === Market analysis runs in background (fire-and-forget) ===
    const presId = createdIdRef.current!;
    const tenantId = profile!.tenant_id!;

    runMarketAnalysisBackground(presId, tenantId, user!.id, propertyData, marketData).catch(err => {
      console.error("Background market analysis failed (non-fatal):", err);
    });
  };

  /** Runs market analysis in background — never blocks UI */
  const runMarketAnalysisBackground = async (
    presId: string, tenantId: string, userId: string,
    propData: PropertyData, mktData: MarketStudyData
  ) => {
    if (mktData.selectedPortals.length === 0) return;

    const { data: portalSources } = await supabase
      .from("portal_sources").select("id, name, code")
      .in("id", mktData.selectedPortals);

    // === 1. Create market_study (official flow) ===
    const { data: study, error: studyErr } = await supabase.from("market_studies").insert({
      broker_id: userId, tenant_id: tenantId,
      title: propData.title || "Estudo de Mercado",
      purpose: propData.property_purpose || "venda",
      status: "processing",
    }).select().single();

    if (!study || studyErr) { console.error("Failed to create market study:", studyErr); return; }

    // Link study to presentation
    await supabase.from("presentations").update({ market_study_id: study.id }).eq("id", presId);

    // Create subject property
    await supabase.from("market_study_subject_properties").insert({
      market_study_id: study.id, property_type: propData.property_type || null,
      property_category: propData.property_type || null, address: propData.address || null,
      neighborhood: propData.neighborhood || null, city: propData.city || null,
      state: propData.state || null, condominium: propData.condominium || null, cep: propData.cep || null,
      area_useful: propData.area_useful ? Number(propData.area_useful) : (propData.area_total ? Number(propData.area_total) : null),
      area_built: propData.area_built ? Number(propData.area_built) : null,
      area_land: propData.area_land ? Number(propData.area_land) : null,
      bedrooms: propData.bedrooms ? Number(propData.bedrooms) : null,
      suites: propData.suites ? Number(propData.suites) : null,
      bathrooms: propData.bathrooms ? Number(propData.bathrooms) : null,
      parking_spots: propData.parking_spots ? Number(propData.parking_spots) : null,
      living_rooms: propData.living_rooms ? Number(propData.living_rooms) : null,
      powder_rooms: propData.powder_rooms ? Number(propData.powder_rooms) : null,
      construction_standard: propData.construction_standard || propData.property_standard || null,
      conservation_state: propData.conservation_state || null,
      differentials: propData.differentials.length > 0 ? propData.differentials as any : [],
      condominium_fee: propData.condominium_fee ? Number(propData.condominium_fee) : null,
      iptu: propData.iptu ? Number(propData.iptu) : null,
      pricing_objective: propData.pricing_objective || null, property_age: propData.property_age || null,
      owner_expected_price: propData.owner_expected_price ? Number(propData.owner_expected_price) : null,
      observations: propData.notes || null, purpose: propData.property_purpose || "venda",
    });

    // === 2. Run scraping cascade ===
    const portals = (portalSources || []).map((p: any) => ({ id: p.id, name: p.name, code: p.code }));
    const analyzeBody = {
      property: propData, portals,
      filters: {
        searchRadius: mktData.searchRadius, minArea: mktData.minArea, maxArea: mktData.maxArea,
        minPrice: mktData.minPrice, maxPrice: mktData.maxPrice,
        minComparables: mktData.minComparables, maxComparables: mktData.maxComparables,
        preferSameCondominium: mktData.preferSameCondominium, maxListingAgeMonths: mktData.maxListingAgeMonths,
      },
      market_study_id: study.id,
      tenant_id: tenantId,
    };

    let scrapedComparables: any[] = [];

    // Cascade: Manus → Firecrawl Deep → Firecrawl Basic
    try {
      console.log("Trying analyze-market-manus...");
      const { data: manusResult, error: manusError } = await supabase.functions.invoke("analyze-market-manus", { body: analyzeBody });
      if (!manusError && manusResult?.success && manusResult?.comparables?.length) {
        scrapedComparables = manusResult.comparables;
        toast.success(`Manus encontrou ${manusResult.comparables.length} comparáveis`);
      } else {
        throw new Error(manusError?.message || manusResult?.message || "No results");
      }
    } catch (manusErr) {
      console.warn("Manus failed, trying Firecrawl deep...", manusErr);
      try {
        const { data: deepResult, error: deepError } = await supabase.functions.invoke("analyze-market-deep", { body: analyzeBody });
        // 202 = background processing — edge function saves comparables directly to DB
        if (!deepError && deepResult?.message === "Processing started in background") {
          console.log("Market analysis running in background for study:", study.id);
          toast.info("Estudo de mercado sendo processado em background...");
          // Poll for completion
          pollStudyStatus(study.id, presId, propData);
          return;
        }
        // Sync mode — edge function already saved to DB if market_study_id was provided
        if (!deepError && deepResult?.success && deepResult?.comparables?.length) {
          scrapedComparables = deepResult.comparables;
          toast.success(`${deepResult.research_metadata?.total_listings_found || 0} anúncios encontrados, ${deepResult.comparables.length} selecionados`);
        } else {
          throw new Error(deepError?.message || deepResult?.message || "No results");
        }
      } catch (deepErr) {
        console.warn("Firecrawl deep failed, trying basic...", deepErr);
        try {
          const { data: basicResult, error: basicError } = await supabase.functions.invoke("analyze-market", { body: analyzeBody });
          if (!basicError && basicResult?.success && basicResult?.comparables?.length) {
            scrapedComparables = basicResult.comparables;
          } else {
            console.warn("All search methods failed.");
            toast.warning("Não foi possível buscar comparáveis nos portais.");
          }
        } catch (basicErr) {
          console.error("All methods failed:", basicErr);
          toast.warning("Erro ao buscar comparáveis nos portais.");
        }
      }
    }

    // === 3. Edge function already saved comparables/adjustments/results to DB ===
    // Just update presentation sections with results from DB
    if (scrapedComparables.length > 0) {
      await updatePresentationSectionsFromStudy(study.id, presId, propData);
      toast.success("Estudo de mercado concluído!");
    } else {
      // No comparables from sync response — edge function may have saved to DB
      console.log("No comparables returned from sync call, checking DB...");
    }
  };

  /** Polls study status every 5s until completed/failed, then updates presentation sections */
  const pollStudyStatus = async (studyId: string, presId: string, propData: PropertyData) => {
    const MAX_POLLS = 60; // 5 min max
    let polls = 0;
    const interval = setInterval(async () => {
      polls++;
      try {
        const { data: study } = await supabase
          .from("market_studies")
          .select("status")
          .eq("id", studyId)
          .single();

        if (!study || polls >= MAX_POLLS) {
          clearInterval(interval);
          if (polls >= MAX_POLLS) {
            toast.warning("Estudo de mercado está demorando mais que o esperado. Verifique depois.");
          }
          return;
        }

        if (study.status === "completed") {
          clearInterval(interval);
          await updatePresentationSectionsFromStudy(studyId, presId, propData);
          toast.success("Estudo de mercado concluído!");
        } else if (study.status === "failed") {
          clearInterval(interval);
          toast.error("Estudo de mercado falhou. Tente novamente.");
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 5000);
  };

  /** Reads market_study_results + comparables from DB and updates presentation sections */
  const updatePresentationSectionsFromStudy = async (studyId: string, presId: string, propData: PropertyData) => {
    const [{ data: results }, { data: comps }] = await Promise.all([
      supabase.from("market_study_results").select("*").eq("market_study_id", studyId).limit(1),
      supabase.from("market_study_comparables").select("title, price, area, price_per_sqm").eq("market_study_id", studyId).eq("is_approved", true),
    ]);

    const result = results?.[0];
    if (!result || !comps?.length) return;

    const chartComparables = comps.map((c: any) => ({
      title: c.title, price: c.price, area: c.area, price_per_sqm: c.price_per_sqm,
    }));

    await Promise.all([
      supabase.from("presentation_sections").update({
        content: {
          owner_expected_price: propData.owner_expected_price ? Number(propData.owner_expected_price) : null,
          scenarios: [
            { label: "Preço aspiracional", value: result.suggested_ad_price },
            { label: "Preço de mercado", value: result.suggested_market_price },
            { label: "Preço de venda rápida", value: result.suggested_fast_sale_price },
          ],
        } as any,
      }).eq("presentation_id", presId).eq("section_key", "pricing_scenarios"),
      supabase.from("presentation_sections").update({
        content: {
          comparables: chartComparables,
          owner_expected_price: propData.owner_expected_price ? Number(propData.owner_expected_price) : null,
          avg_price: result.avg_price, median_price: result.median_price,
          avg_price_per_sqm: result.avg_price_per_sqm, status: "completed",
        } as any,
      }).eq("presentation_id", presId).eq("section_key", "market_study_placeholder"),
    ]);
  };

  const handleAnimationDone = useCallback(() => {
    setIsComplete(true);
    setTimeout(() => {
      if (createdIdRef.current) navigate(`/presentations/${createdIdRef.current}/edit`);
    }, 1500);
  }, [navigate]);

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

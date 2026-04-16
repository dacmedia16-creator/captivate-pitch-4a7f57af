import { supabase } from "@/integrations/supabase/client";

interface GenerateParams {
  presentationId: string;
  tenantId: string;
  brokerId: string;
}

const DEFAULT_OBJECTIVES = [
  { icon: "key", title: "Vender seu imóvel", description: "Com estratégia e dedicação total ao seu objetivo." },
  { icon: "chart", title: "Pelo melhor preço, no menor tempo", description: "Utilizando análise de mercado e precificação inteligente." },
  { icon: "checklist", title: "E com comodidade pra você", description: "Cuidamos de toda a burocracia e documentação." },
];

const DEFAULT_VALUE_PROPOSITIONS = [
  { title: "Profissionalismo", description: "Equipe altamente qualificada e treinada para oferecer o melhor atendimento." },
  { title: "Segurança", description: "Processos seguros e transparentes em todas as etapas da negociação." },
  { title: "Parcerias", description: "Rede de parceiros estratégicos para maximizar a visibilidade do seu imóvel." },
];

const DEFAULT_GLOBAL_STATS = { countries: 0, units: 0, brokers: 0 };

const DEFAULT_REQUIRED_DOCUMENTS = [
  { title: "Certidão atualizada de ônus reais", required: true },
  { title: "Espelho do IPTU", required: true },
  { title: "Cópia do RG e CPF dos proprietários", required: true },
  { title: "Cópia da conta de luz ou água", required: true },
  { title: "Documentação para análise prévia e divulgação", required: true },
];

const SECTION_DEFINITIONS = [
  { key: "cover", title: "Capa", order: 0 },
  { key: "objectives_alignment", title: "Alinhamento de Objetivos", order: 1 },
  { key: "agency_value_proposition", title: "Proposta de Valor", order: 2 },
  { key: "broker_intro", title: "Apresentação do Corretor", order: 3 },
  { key: "about_global", title: "Apresentação Mundial", order: 4 },
  { key: "about_national", title: "Apresentação Nacional", order: 5 },
  { key: "about_regional", title: "Apresentação Regional", order: 6 },
  { key: "property_summary", title: "Resumo do Imóvel", order: 7 },
  { key: "marketing_plan", title: "Plano de Marketing", order: 8 },
  { key: "differentials", title: "Diferenciais", order: 9 },
  { key: "results", title: "Resultados", order: 10 },
  { key: "market_study_subject", title: "Imóvel Avaliado", order: 11 },
  { key: "market_study_comparables", title: "Comparáveis de Mercado", order: 13 },
  { key: "pricing_scenarios", title: "Cenários de Preço", order: 14 },
  { key: "required_documentation", title: "Documentação Necessária", order: 15 },
  { key: "closing", title: "Fechamento", order: 16 },
];

/** Fetch market data from the official market_studies flow, with legacy fallback */
async function fetchMarketData(presentation: any) {
  let comparables: any[] = [];
  let report: any = null;

  if (presentation.market_study_id) {
    // OFFICIAL FLOW: read from market_study_comparables & market_study_results
    const [compsRes, resultRes] = await Promise.all([
      supabase.from("market_study_comparables").select("*").eq("market_study_id", presentation.market_study_id).eq("is_approved", true),
      supabase.from("market_study_results").select("*").eq("market_study_id", presentation.market_study_id).single(),
    ]);
    comparables = compsRes.data || [];
    report = resultRes.data;
  } else {
    // LEGACY COMPAT (read-only): fallback for pre-migration presentations without market_study_id.
    // Tables market_analysis_jobs, market_comparables, market_reports are read-only — no new data is written.
    const { data: jobs } = await supabase.from("market_analysis_jobs").select("id").eq("presentation_id", presentation.id);
    if (jobs && jobs.length > 0) {
      const jobId = jobs[0].id;
      const [compsRes, repRes] = await Promise.all([
        supabase.from("market_comparables").select("*").eq("market_analysis_job_id", jobId).eq("is_approved", true),
        supabase.from("market_reports").select("*").eq("market_analysis_job_id", jobId).single(),
      ]);
      comparables = compsRes.data || [];
      report = repRes.data;
    }
  }

  return { comparables, report };
}

export async function generatePresentationSections({ presentationId, tenantId, brokerId }: GenerateParams) {
  const [
    { data: presentation },
    { data: brokerProfile },
    { data: profile },
    { data: agency },
    { data: marketingActions },
    { data: differentials },
    { data: salesResults },
    { data: testimonials },
    { data: images },
  ] = await Promise.all([
    supabase.from("presentations").select("*").eq("id", presentationId).single(),
    supabase.from("broker_profiles").select("*").eq("user_id", brokerId).single(),
    supabase.from("profiles").select("*").eq("id", brokerId).single(),
    supabase.from("agency_profiles").select("*").eq("tenant_id", tenantId).single(),
    supabase.from("marketing_actions").select("*").eq("tenant_id", tenantId).eq("is_active", true).order("sort_order"),
    supabase.from("competitive_differentials").select("*").eq("tenant_id", tenantId).eq("is_active", true).order("sort_order"),
    supabase.from("sales_results").select("*").eq("tenant_id", tenantId).order("sort_order"),
    supabase.from("testimonials").select("*").eq("tenant_id", tenantId).order("sort_order"),
    supabase.from("presentation_images").select("*").eq("presentation_id", presentationId).order("sort_order"),
  ]);

  // Fetch market data from official or legacy flow
  const { comparables, report } = presentation ? await fetchMarketData(presentation) : { comparables: [], report: null };

  // Fetch subject property if market_study_id exists
  let subjectProperty: any = null;
  if (presentation?.market_study_id) {
    const { data } = await supabase.from("market_study_subject_properties").select("*").eq("market_study_id", presentation.market_study_id).single();
    subjectProperty = data;
  }

  const agencyAny = agency as any;

  const sections = SECTION_DEFINITIONS.map(def => {
    let content: Record<string, any> = {};

    switch (def.key) {
      case "cover":
        content = {
          title: presentation?.title || "Apresentação de Captação",
          address: presentation?.address,
          city: presentation?.city,
          neighborhood: presentation?.neighborhood,
          property_type: presentation?.property_type,
          broker_name: profile?.full_name,
          agency_name: agency?.company_name,
          logo_url: agency?.logo_url,
          cover_image: images?.[0]?.image_url || null,
        };
        break;
      case "objectives_alignment":
        content = {
          objectives: agencyAny?.objectives || DEFAULT_OBJECTIVES,
          logo_url: agency?.logo_url,
          agency_name: agency?.company_name,
        };
        break;
      case "agency_value_proposition":
        content = {
          value_propositions: agencyAny?.value_propositions || DEFAULT_VALUE_PROPOSITIONS,
          global_stats: agencyAny?.global_stats || DEFAULT_GLOBAL_STATS,
          logo_url: agency?.logo_url,
          agency_name: agency?.company_name,
        };
        break;
      case "broker_intro":
        content = {
          name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          creci: brokerProfile?.creci,
          short_bio: brokerProfile?.short_bio,
          years_in_market: brokerProfile?.years_in_market,
          education: brokerProfile?.education,
          specialties: brokerProfile?.specialties,
          service_regions: brokerProfile?.service_regions,
          vgv_summary: brokerProfile?.vgv_summary,
        };
        break;
      case "about_global":
        content = { text: agency?.about_global, stats: agencyAny?.about_global_stats, logo_url: agency?.logo_url, image_url: agencyAny?.about_global_image_url };
        break;
      case "about_national":
        content = { text: agency?.about_national, stats: agencyAny?.about_national_stats, logo_url: agency?.logo_url, image_url: agencyAny?.about_national_image_url };
        break;
      case "about_regional":
        content = { text: agency?.about_regional, stats: agencyAny?.about_regional_stats, regional_numbers: agency?.regional_numbers, branch_photo_url: agency?.branch_photo_url, image_url: agencyAny?.about_regional_image_url };
        break;
      case "property_summary":
        content = {
          title: presentation?.title,
          address: presentation?.address,
          city: presentation?.city,
          neighborhood: presentation?.neighborhood,
          property_type: presentation?.property_type,
          property_purpose: presentation?.property_purpose,
          area_total: presentation?.area_total,
          area_built: presentation?.area_built,
          area_land: presentation?.area_land,
          bedrooms: presentation?.bedrooms,
          suites: presentation?.suites,
          bathrooms: presentation?.bathrooms,
          parking_spots: presentation?.parking_spots,
          property_standard: presentation?.property_standard,
          property_age: presentation?.property_age,
          highlights: presentation?.highlights,
          condominium: presentation?.condominium,
          images: images?.map(img => img.image_url) || [],
        };
        break;
      case "marketing_plan":
        content = { actions: marketingActions || [] };
        break;
      case "differentials":
        content = { items: differentials || [] };
        break;
      case "results": {
        const brokerAny = brokerProfile as any;
        const personalResults = Array.isArray(brokerAny?.personal_results) && brokerAny.personal_results.length > 0
          ? brokerAny.personal_results : null;
        const personalTestimonials = Array.isArray(brokerAny?.personal_testimonials) && brokerAny.personal_testimonials.length > 0
          ? brokerAny.personal_testimonials : null;
        const portfolioImages = Array.isArray(brokerAny?.portfolio_images) ? brokerAny.portfolio_images : [];
        content = {
          items: personalResults || salesResults || [],
          testimonials: personalTestimonials || testimonials || [],
          portfolio_images: portfolioImages,
          broker_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
        };
        break;
      }
      case "market_study_subject":
        if (report) {
          const subjectForSlideSubject = subjectProperty ? {
            property_type: subjectProperty.property_type,
            construction_standard: subjectProperty.construction_standard,
            conservation_state: subjectProperty.conservation_state,
            property_age: subjectProperty.property_age,
            area_built: subjectProperty.area_built,
            area_land: subjectProperty.area_land,
            area_useful: subjectProperty.area_useful,
            bedrooms: subjectProperty.bedrooms,
            suites: subjectProperty.suites,
            bathrooms: subjectProperty.bathrooms,
            parking_spots: subjectProperty.parking_spots,
            neighborhood: subjectProperty.neighborhood,
            city: subjectProperty.city,
            condominium: subjectProperty.condominium,
            differentials: subjectProperty.differentials,
            owner_expected_price: subjectProperty.owner_expected_price,
          } : null;
          content = {
            status: "completed",
            subject_property: subjectForSlideSubject,
            confidence_level: report.confidence_level,
            executive_summary: report.executive_summary || report.summary,
          };
        } else {
          content = { status: "pending", message: "O estudo de mercado será inserido aqui após processamento." };
        }
        break;
      case "market_study_comparables":
        if (report) {
          const comparablesForTable = comparables.map((comp: any) => ({
            title: comp.title,
            price: comp.price,
            area: comp.area,
            bedrooms: comp.bedrooms,
            suites: comp.suites,
            parking_spots: comp.parking_spots,
            bathrooms: comp.bathrooms,
            neighborhood: comp.neighborhood,
            condominium: comp.condominium,
            conservation_state: comp.conservation_state,
            construction_standard: comp.construction_standard,
            similarity_score: comp.similarity_score,
            adjusted_price: comp.adjusted_price,
            price_per_sqm: comp.price_per_sqm,
            source_name: comp.source_name,
            source_url: comp.source_url,
          }));
          content = {
            status: "completed",
            comparables: comparablesForTable,
            comparables_count: comparables.length,
          };
        } else {
          content = { status: "pending" };
        }
        break;
      case "pricing_scenarios":
        content = {
          owner_expected_price: presentation?.owner_expected_price,
          scenarios: [
            { label: "Preço de mercado", value: report?.suggested_market_price || null },
            { label: "Preço de venda rápida", value: report?.suggested_fast_sale_price || null },
          ],
        };
        break;
      case "required_documentation":
        content = {
          documents: (presentation as any)?.required_documents || DEFAULT_REQUIRED_DOCUMENTS,
          broker_name: profile?.full_name,
          agency_name: agency?.company_name,
        };
        break;
      case "closing":
        content = {
          broker_name: profile?.full_name,
          broker_phone: profile?.phone,
          broker_email: profile?.email,
          agency_name: agency?.company_name,
          logo_url: agency?.logo_url,
        };
        break;
    }

    return {
      presentation_id: presentationId,
      section_key: def.key,
      title: def.title,
      sort_order: def.order,
      is_visible: true,
      content,
    };
  });

  const { error } = await supabase.from("presentation_sections").insert(sections);
  if (error) throw error;

  await supabase.from("presentations").update({ status: "generated" }).eq("id", presentationId);

  return sections;
}

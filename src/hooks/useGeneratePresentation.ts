import { supabase } from "@/integrations/supabase/client";

interface GenerateParams {
  presentationId: string;
  tenantId: string;
  brokerId: string;
}

const SECTION_DEFINITIONS = [
  { key: "cover", title: "Capa", order: 0 },
  { key: "broker_intro", title: "Apresentação do Corretor", order: 1 },
  { key: "about_global", title: "Apresentação Mundial", order: 2 },
  { key: "about_national", title: "Apresentação Nacional", order: 3 },
  { key: "about_regional", title: "Apresentação Regional", order: 4 },
  { key: "property_summary", title: "Resumo do Imóvel", order: 5 },
  { key: "marketing_plan", title: "Plano de Marketing", order: 6 },
  { key: "differentials", title: "Diferenciais", order: 7 },
  { key: "results", title: "Resultados", order: 8 },
  { key: "market_study_placeholder", title: "Estudo de Mercado", order: 9 },
  { key: "pricing_scenarios", title: "Cenários de Preço", order: 10 },
  { key: "closing", title: "Fechamento", order: 11 },
];

export async function generatePresentationSections({ presentationId, tenantId, brokerId }: GenerateParams) {
  // Fetch all data in parallel
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
        content = { text: agency?.about_global, logo_url: agency?.logo_url, image_url: (agency as any)?.about_global_image_url };
        break;
      case "about_national":
        content = { text: agency?.about_national, logo_url: agency?.logo_url, image_url: (agency as any)?.about_national_image_url };
        break;
      case "about_regional":
        content = { text: agency?.about_regional, regional_numbers: agency?.regional_numbers, branch_photo_url: agency?.branch_photo_url, image_url: (agency as any)?.about_regional_image_url };
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
      case "results":
        content = { items: salesResults || [], testimonials: testimonials || [] };
        break;
      case "market_study_placeholder":
        content = { status: "pending", message: "O estudo de mercado será inserido aqui após processamento." };
        break;
      case "pricing_scenarios":
        content = {
          owner_expected_price: presentation?.owner_expected_price,
          scenarios: [
            { label: "Preço aspiracional", value: null },
            { label: "Preço de mercado", value: null },
            { label: "Preço de venda rápida", value: null },
          ],
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

  // Update presentation status
  await supabase.from("presentations").update({ status: "generated" }).eq("id", presentationId);

  return sections;
}

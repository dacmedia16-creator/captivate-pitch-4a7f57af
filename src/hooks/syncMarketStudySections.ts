import { supabase } from "@/integrations/supabase/client";

/**
 * Syncs market study results to all linked presentation sections.
 * Call after recalculation or when market_study_results change.
 */
export async function syncMarketStudySections(marketStudyId: string) {
  const [resultRes, compsRes, presRes, subjectRes] = await Promise.all([
    supabase.from("market_study_results").select("*").eq("market_study_id", marketStudyId).single(),
    supabase.from("market_study_comparables").select("*").eq("market_study_id", marketStudyId).eq("is_approved", true),
    supabase.from("presentations").select("id, owner_expected_price").eq("market_study_id", marketStudyId),
    supabase.from("market_study_subject_properties").select("*").eq("market_study_id", marketStudyId).single(),
  ]);

  const report = resultRes.data;
  const comparables = compsRes.data || [];
  const presentations = presRes.data || [];
  const subject = subjectRes.data;

  if (!report || presentations.length === 0) return;

  const subjectForSlide = subject ? {
    property_type: subject.property_type,
    construction_standard: subject.construction_standard,
    conservation_state: subject.conservation_state,
    property_age: subject.property_age,
    area_built: subject.area_built,
    area_land: subject.area_land,
    area_useful: subject.area_useful,
    bedrooms: subject.bedrooms,
    suites: subject.suites,
    bathrooms: subject.bathrooms,
    parking_spots: subject.parking_spots,
    neighborhood: subject.neighborhood,
    city: subject.city,
    condominium: subject.condominium,
    differentials: subject.differentials,
    owner_expected_price: subject.owner_expected_price,
  } : null;

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

  const comparablesForStats = comparables.map((comp: any) => ({
    title: comp.title,
    price: comp.price,
    area: comp.area,
    neighborhood: comp.neighborhood,
    price_per_sqm: comp.price_per_sqm,
  }));

  for (const pres of presentations) {
    const subjectContent = {
      status: "completed",
      subject_property: subjectForSlide,
      confidence_level: report.confidence_level,
      executive_summary: report.executive_summary,
      avg_price: report.avg_price,
      suggested_market_price: report.suggested_market_price,
    };

    const statsContent = {
      status: "completed",
      avg_price: report.avg_price,
      median_price: report.median_price,
      avg_price_per_sqm: report.avg_price_per_sqm,
      comparables_count: comparables.length,
      comparables: comparablesForStats,
      owner_expected_price: pres.owner_expected_price || subject?.owner_expected_price,
    };

    const comparablesContent = {
      status: "completed",
      comparables: comparablesForTable,
      comparables_count: comparables.length,
    };

    const pricingScenariosContent = {
      owner_expected_price: pres.owner_expected_price || subject?.owner_expected_price,
      scenarios: [
        { label: "Preço de mercado", value: report.suggested_market_price || null },
        { label: "Preço de venda rápida", value: report.suggested_fast_sale_price || null },
      ],
    };

    // Check if new sections exist; if not, insert them
    const { data: existingSections } = await supabase
      .from("presentation_sections")
      .select("section_key")
      .eq("presentation_id", pres.id)
      .in("section_key", ["market_study_subject", "market_study_comparables"]);

    const existingKeys = new Set((existingSections || []).map(s => s.section_key));

    const newSections = [
      { key: "market_study_subject", title: "Imóvel Avaliado", order: 11, content: subjectContent },
      { key: "market_study_comparables", title: "Comparáveis de Mercado", order: 13, content: comparablesContent },
    ];

    const toInsert = newSections
      .filter(s => !existingKeys.has(s.key))
      .map(s => ({
        presentation_id: pres.id,
        section_key: s.key,
        title: s.title,
        sort_order: s.order,
        is_visible: true,
        content: s.content as any,
      }));

    const toUpdate = newSections.filter(s => existingKeys.has(s.key));

    await Promise.all([
      ...(toInsert.length > 0 ? [supabase.from("presentation_sections").insert(toInsert)] : []),
      ...toUpdate.map(s =>
        supabase.from("presentation_sections").update({ content: s.content as any }).eq("presentation_id", pres.id).eq("section_key", s.key)
      ),
      supabase.from("presentation_sections").update({ content: pricingScenariosContent as any, sort_order: 14 }).eq("presentation_id", pres.id).eq("section_key", "pricing_scenarios"),
      supabase.from("presentation_sections").update({ sort_order: 15 }).eq("presentation_id", pres.id).eq("section_key", "required_documentation"),
      supabase.from("presentation_sections").update({ sort_order: 16 }).eq("presentation_id", pres.id).eq("section_key", "closing"),
    ]);
  }

  console.log(`[SYNC] Updated ${presentations.length} presentation(s) with market study ${marketStudyId}`);
}

import { SectionData } from "./SectionRenderer";
import { MarketPriceBarChart, MarketStats } from "@/components/charts/MarketCharts";
import { BrazilPresenceMap } from "@/components/charts/BrazilPresenceMap";
import { Key, BarChart3, ClipboardCheck, FileText, CheckCircle } from "lucide-react";
import { SlideTheme, ResolvedColors } from "./themes/theme.types";
import { SlideLabel, SlideDivider, SlideMetricRow, SlideImageGrid, SlideScenarios, SlideItemList, SlideStatBar } from "./slide-components";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
  theme: SlideTheme;
  colors: ResolvedColors;
}

export function LayoutImpactoComercial({ section, branding, theme, colors }: Props) {
  const c = section.content || {};
  const { primary, accent, deep, textMuted } = colors;
  const FONT = theme.font;
  const textTransform = theme.heading.textTransform as any;

  /* ═══════ COVER ═══════ */
  if (section.section_key === "cover") {
    return (
      <div className="relative w-full h-full overflow-hidden flex flex-col justify-end text-white" style={{ fontFamily: FONT }}>
        {c.cover_image && <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: theme.cover.overlay(primary, deep) }} />
        {c.logo_url && <img src={c.logo_url} alt="" className="absolute top-12 right-14 h-14 object-contain opacity-80" />}
        <div className="relative z-10 p-16 pb-20">
          <div className="w-24 h-1.5 mb-8" style={{ backgroundColor: accent }} />
          <h1 className="slide-title text-white uppercase leading-[1] max-w-[1100px]" style={{ fontSize: theme.cover.titleSize }}>{c.title}</h1>
          <p className="font-bold tracking-[0.3em] uppercase mt-8" style={{ fontSize: "22px", color: accent }}>{[c.neighborhood, c.city].filter(Boolean).join(" · ")}</p>
          {c.broker_name && <p className="text-white/35 mt-5 tracking-wide" style={{ fontSize: "20px" }}>{c.broker_name} | {c.agency_name}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ BROKER INTRO ═══════ */
  if (section.section_key === "broker_intro") {
    return (
      <div className="w-full h-full bg-white flex" style={{ fontFamily: FONT }}>
        <div className="flex-1 p-16 flex flex-col justify-center">
          <SlideLabel color={accent} bold>Seu consultor</SlideLabel>
          <h2 className="slide-title mt-5 uppercase" style={{ fontSize: "56px", color: primary }}>{c.name}</h2>
          {c.creci && <p className="tracking-[0.25em] mt-3 mb-10" style={{ fontSize: "18px", color: colors.textLight }}>CRECI {c.creci}</p>}
          <div className="w-16 h-1.5 mb-8" style={{ backgroundColor: accent }} />
          {c.short_bio && <p className="slide-body max-w-[550px]" style={{ color: textMuted }}>{c.short_bio}</p>}
          {c.education && <p className="mt-4" style={{ fontSize: "20px", color: colors.textLight }}>🎓 {c.education}</p>}
          {c.service_regions && <p className="mt-3" style={{ fontSize: "20px", color: colors.textLight }}>📍 {c.service_regions}</p>}
          <div className="flex gap-8 mt-12">
            {c.years_in_market && (
              <div className="px-10 py-6 text-white" style={{ backgroundColor: accent }}>
                <p className="slide-metric" style={{ fontSize: "52px" }}>{c.years_in_market}</p>
                <p className="uppercase tracking-[0.25em] opacity-80 mt-3" style={{ fontSize: "16px" }}>Anos</p>
              </div>
            )}
            {c.specialties && (
              <div className="px-10 py-6 border-2" style={{ borderColor: primary, color: primary }}>
                <p className="font-bold" style={{ fontSize: "22px" }}>{c.specialties}</p>
                <p className="uppercase tracking-[0.25em] opacity-50 mt-3" style={{ fontSize: "16px" }}>Especialidade</p>
              </div>
            )}
          </div>
        </div>
        {c.avatar_url && (
          <div className="w-[38%] relative">
            <img src={c.avatar_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
      </div>
    );
  }

  /* ═══════ PROPERTY SUMMARY ═══════ */
  if (section.section_key === "property_summary") {
    return (
      <div className="w-full h-full bg-white" style={{ fontFamily: FONT }}>
        {c.images?.length > 0 && <img src={c.images[0]} alt="" className="w-full object-cover" style={{ height: 460 }} />}
        <div className="p-16 space-y-8">
          <SlideLabel color={accent} bold>O imóvel</SlideLabel>
          <h2 className="slide-title uppercase" style={{ fontSize: "48px", color: primary }}>{c.title || section.title}</h2>
          <div className="w-16 h-1.5" style={{ backgroundColor: accent }} />
          <SlideMetricRow
            items={[
              { label: "M²", value: c.area_total },
              { label: "QUARTOS", value: c.bedrooms },
              { label: "SUÍTES", value: c.suites },
              { label: "VAGAS", value: c.parking_spots },
            ]}
            colors={colors}
            metricSize={theme.metric.size}
            labelSize={theme.metric.labelSize}
            labelTracking={theme.metric.labelTracking}
          />
          {c.highlights && (
            <p className="slide-body border-l-4 pl-8" style={{ borderColor: accent, color: textMuted }}>{c.highlights}</p>
          )}
        </div>
      </div>
    );
  }

  /* ═══════ DIFFERENTIALS ═══════ */
  if (section.section_key === "differentials") {
    return (
      <div className="w-full h-full text-white p-16" style={{ backgroundColor: deep, fontFamily: FONT }}>
        <SlideLabel color="rgba(255,255,255,0.5)" bold>Por que nos escolher</SlideLabel>
        <h2 className="slide-title text-white uppercase mt-4 mb-12" style={{ fontSize: "44px" }}>{section.title || "Nossos diferenciais"}</h2>
        <div className="grid grid-cols-2 gap-x-14 gap-y-10">
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-6 py-6 border-b border-white/10 last:border-0">
              <span className="slide-metric shrink-0" style={{ fontSize: "36px", color: accent }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h4 className="font-bold" style={{ fontSize: "22px", color: accent }}>{item.title}</h4>
                {item.description && <p className="text-white/45 mt-3 leading-relaxed" style={{ fontSize: "19px" }}>{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════ RESULTS ═══════ */
  if (section.section_key === "results") {
    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent} bold>Resultados comprovados</SlideLabel>
        <h2 className="slide-title uppercase mt-4 mb-12" style={{ fontSize: theme.heading.titleSize, color: primary }}>{section.title}</h2>
        <div className="flex gap-10 mb-12">
          {(c.items || []).slice(0, 3).map((item: any, i: number) => (
            <div key={i} className="flex-1 py-10 text-center" style={{ backgroundColor: primary + "08" }}>
              {item.metric_value && <p className="slide-metric" style={{ fontSize: "56px", color: accent }}>{item.metric_value}</p>}
              <p className="font-bold mt-4 uppercase tracking-[0.2em]" style={{ fontSize: "18px", color: primary }}>{item.title}</p>
            </div>
          ))}
        </div>
        {c.testimonials?.length > 0 && (
          <div className="space-y-6">
            {c.testimonials.slice(0, 2).map((t: any, i: number) => (
              <div key={i} className="py-8 border-t border-gray-100">
                <p className="slide-body italic" style={{ color: textMuted }}>"{t.content}"</p>
                <p className="font-bold mt-5" style={{ fontSize: "20px", color: primary }}>{t.author_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ═══════ MARKET STUDY ═══════ */
  if (section.section_key === "market_study_placeholder" && c.comparables?.length > 0) {
    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent} bold>Análise de mercado</SlideLabel>
        <h2 className="slide-title uppercase mt-4 mb-10" style={{ fontSize: theme.heading.titleSize, color: primary }}>{section.title}</h2>
        <div className="w-16 h-1.5 mb-10" style={{ backgroundColor: accent }} />
        <MarketStats avgPrice={c.avg_price} medianPrice={c.median_price} avgPricePerSqm={c.avg_price_per_sqm} totalComparables={c.comparables.length} compact primaryColor={primary} accentColor={accent} />
        <div className="mt-10">
          <MarketPriceBarChart comparables={c.comparables} ownerExpectedPrice={c.owner_expected_price} compact primaryColor={primary} accentColor={accent} />
        </div>
      </div>
    );
  }

  /* ═══════ CLOSING ═══════ */
  if (section.section_key === "closing") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-20" style={{ backgroundColor: deep, fontFamily: FONT }}>
        {c.logo_url && <img src={c.logo_url} alt="" className="h-20 object-contain mb-16 opacity-70" />}
        <h2 className="slide-title text-white uppercase mb-5" style={{ fontSize: "56px" }}>{theme.closing.headline}</h2>
        <p className="text-white/35 font-light mb-12" style={{ fontSize: "24px" }}>{theme.closing.subline}</p>
        <div className="px-14 py-6 font-bold tracking-wider text-white" style={{ fontSize: "28px", backgroundColor: accent }}>
          {c.broker_name}
        </div>
        <div className="space-y-3 text-white/40 mt-10" style={{ fontSize: "22px" }}>
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ OBJECTIVES ALIGNMENT ═══════ */
  if (section.section_key === "objectives_alignment") {
    const objectives = c.objectives || [];
    const iconMap: Record<string, any> = { key: Key, chart: BarChart3, checklist: ClipboardCheck };
    return (
      <div className="w-full h-full bg-white p-16 flex flex-col justify-center" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent} bold>Nosso compromisso</SlideLabel>
        <h2 className="slide-title uppercase mt-4 mb-12" style={{ fontSize: theme.heading.titleSize, color: primary }}>{section.title}</h2>
        <div className="w-16 h-1.5 mb-12" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-3 gap-10">
          {objectives.map((obj: any, i: number) => {
            const Icon = iconMap[obj.icon] || Key;
            return (
              <div key={i} className="text-center space-y-6 p-10" style={{ backgroundColor: primary + "06" }}>
                <div className="mx-auto w-20 h-20 flex items-center justify-center" style={{ backgroundColor: accent }}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-bold uppercase tracking-wider" style={{ fontSize: "24px", color: primary }}>{obj.title}</h3>
                {obj.description && <p className="leading-relaxed" style={{ fontSize: "20px", color: textMuted }}>{obj.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════ AGENCY VALUE PROPOSITION ═══════ */
  if (section.section_key === "agency_value_proposition") {
    const props = c.value_propositions || [];
    const stats = c.global_stats || {};
    return (
      <div className="w-full h-full text-white p-16" style={{ backgroundColor: deep, fontFamily: FONT }}>
        <SlideLabel color="rgba(255,255,255,0.5)" bold>Proposta de valor</SlideLabel>
        <h2 className="slide-title text-white uppercase mt-4 mb-12" style={{ fontSize: theme.heading.titleSize }}>{section.title}</h2>
        <div className="w-16 h-1.5 mb-12" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-3 gap-10 mb-14">
          {props.map((p: any, i: number) => (
            <div key={i} className="py-6 border-t-2" style={{ borderColor: accent }}>
              <h3 className="font-bold uppercase tracking-wider mb-4" style={{ fontSize: "24px", color: accent }}>{p.title}</h3>
              {p.description && <p className="leading-relaxed text-white/50" style={{ fontSize: "20px" }}>{p.description}</p>}
            </div>
          ))}
        </div>
        <SlideStatBar
          items={[
            { label: "PAÍSES", value: stats.countries },
            { label: "UNIDADES", value: stats.units?.toLocaleString("pt-BR") },
            { label: "CORRETORES", value: stats.brokers?.toLocaleString("pt-BR") },
          ]}
          colors={colors}
          variant="accent-block"
          borderRadius="0px"
        />
      </div>
    );
  }

  /* ═══════ REQUIRED DOCUMENTATION ═══════ */
  if (section.section_key === "required_documentation") {
    const docs = c.documents || [];
    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent} bold>Documentação</SlideLabel>
        <h2 className="slide-title uppercase mt-4 mb-12" style={{ fontSize: theme.heading.titleSize, color: primary }}>{section.title}</h2>
        <div className="w-16 h-1.5 mb-12" style={{ backgroundColor: accent }} />
        <div className="space-y-5">
          {docs.map((doc: any, i: number) => (
            <div key={i} className="flex items-center gap-6 p-6 border-b border-gray-100 last:border-0">
              <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ backgroundColor: doc.required ? accent : primary + "15" }}>
                {doc.required ? <CheckCircle className="h-7 w-7 text-white" /> : <FileText className="h-7 w-7" style={{ color: primary }} />}
              </div>
              <p className="font-bold flex-1 uppercase tracking-wider" style={{ fontSize: "22px", color: primary }}>{doc.title}</p>
              <span className="font-bold uppercase tracking-[0.2em] px-5 py-2" style={{
                fontSize: "16px",
                backgroundColor: doc.required ? accent + "15" : primary + "08",
                color: doc.required ? accent : primary,
              }}>
                {doc.required ? "Obrigatório" : "Opcional"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════ ABOUT GLOBAL / NATIONAL / REGIONAL ═══════ */
  if (section.section_key === "about_global" || section.section_key === "about_national" || section.section_key === "about_regional") {
    const stats = c.stats;
    const statItems = stats ? [
      { label: stats.rank ? "RANKING" : null, value: stats.rank },
      { label: "AGÊNCIAS", value: stats.agencies },
      { label: "CORRETORES", value: stats.brokers },
      { label: "FRANQUIAS", value: stats.franchises },
    ].filter((s): s is { label: string; value: any } => !!s.label && !!s.value) : [];

    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent} bold>{section.section_key.replace(/_/g, " ")}</SlideLabel>
        <h2 className="slide-title uppercase mt-4 mb-6" style={{ fontSize: theme.heading.titleSize, color: primary }}>{section.title}</h2>
        <div className="w-16 h-1.5 mb-10" style={{ backgroundColor: accent }} />

        {(() => {
          const displayImage = c.branch_photo_url || c.image_url;
          const hasVisual = displayImage || (section.section_key === "about_national" && stats?.presence_states?.length);
          return (
            <div className={hasVisual ? "grid grid-cols-2 gap-12 items-start" : ""}>
              <div className="space-y-6">
                {c.text && <p className="slide-body whitespace-pre-wrap max-w-[650px]" style={{ color: textMuted }}>{c.text}</p>}
                {stats?.presence_text && <p className="font-bold tracking-[0.25em] uppercase mt-4" style={{ fontSize: "20px", color: accent }}>{stats.presence_text}</p>}
                {statItems.length > 0 && (
                  <div className="flex flex-wrap gap-5 mt-6">
                    {statItems.map((s, i) => (
                      <div key={i} className="px-8 py-6 text-center" style={{ backgroundColor: primary + "08" }}>
                        <p className="slide-metric" style={{ fontSize: "42px", color: primary }}>{typeof s.value === "number" ? s.value.toLocaleString("pt-BR") : s.value}</p>
                        <p className="uppercase tracking-[0.25em] mt-3" style={{ fontSize: "14px", color: colors.textLight }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {c.regional_numbers && (
                  <div className="flex flex-wrap gap-6 mt-6">
                    {c.regional_numbers.split("|").map((item: string, i: number) => (
                      <div key={i} className="px-8 py-5" style={{ backgroundColor: accent + "12" }}>
                        <p className="font-bold" style={{ fontSize: "22px", color: primary }}>{item.trim()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {hasVisual && (
                <div>
                  {section.section_key === "about_national" && stats?.presence_states?.length > 0 && (
                    <BrazilPresenceMap states={stats.presence_states} primaryColor={primary} accentColor={accent} />
                  )}
                  {displayImage && <img src={displayImage} alt="" className="w-full object-contain rounded-lg" />}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  /* ═══════ PRICING SCENARIOS ═══════ */
  if (section.section_key === "pricing_scenarios") {
    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent} bold>Precificação</SlideLabel>
        <h2 className="slide-title uppercase mt-4" style={{ fontSize: theme.heading.titleSize, color: primary }}>{section.title}</h2>
        {c.owner_expected_price && (
          <p className="mt-4 mb-10" style={{ fontSize: "22px", color: colors.textLight }}>
            Valor pretendido: <span className="font-bold" style={{ color: accent }}>R$ {Number(c.owner_expected_price).toLocaleString("pt-BR")}</span>
          </p>
        )}
        <div className="w-16 h-1.5 mb-10" style={{ backgroundColor: accent }} />
        <SlideScenarios scenarios={c.scenarios || []} colors={colors} metricSize="64px" />
      </div>
    );
  }

  /* ═══════ GENERIC ═══════ */
  return (
    <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
      <SlideLabel color={accent} bold>{section.section_key.replace(/_/g, " ")}</SlideLabel>
      <h2 className="slide-title uppercase mt-4 mb-6" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
      <div className="w-16 h-1.5 mb-10" style={{ backgroundColor: accent }} />

      <div className="space-y-8">
        {c.text && <p className="slide-body whitespace-pre-wrap max-w-[800px]" style={{ color: textMuted }}>{c.text}</p>}
        {c.image_url && <img src={c.image_url} alt="" className="max-h-[420px] object-cover w-full rounded-lg" />}
        {c.branch_photo_url && <img src={c.branch_photo_url} alt="" className="max-h-[420px] object-cover w-full rounded-lg" />}

        {c.actions && (
          <div className="grid grid-cols-2 gap-x-12 gap-y-8">
            {c.actions.map((a: any, i: number) => (
              <div key={i} className="py-5 border-b border-gray-100">
                <div className="flex items-baseline gap-5">
                  <span className="slide-metric" style={{ fontSize: "32px", color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                  <h4 className="font-bold uppercase tracking-wider" style={{ fontSize: "22px", color: primary }}>{a.title}</h4>
                </div>
                {a.description && <p className="mt-3 ml-14 leading-relaxed" style={{ fontSize: "19px", color: colors.textLight }}>{a.description}</p>}
              </div>
            ))}
          </div>
        )}

        {c.items && <SlideItemList items={c.items} colors={colors} />}
        {c.scenarios && <SlideScenarios scenarios={c.scenarios} colors={colors} metricSize="56px" />}

        {!c.text && !c.actions && !c.items && !c.scenarios && (
          <p className="italic" style={{ fontSize: "22px", color: "#D1D5DB" }}>Conteúdo não preenchido</p>
        )}
      </div>
    </div>
  );
}

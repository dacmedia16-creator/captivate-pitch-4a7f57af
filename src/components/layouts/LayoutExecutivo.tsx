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

export function LayoutExecutivo({ section, branding, theme, colors }: Props) {
  const c = section.content || {};
  const { primary, accent, neutral, textMuted } = colors;
  const FONT = theme.font;
  const textTransform = theme.heading.textTransform as any;

  const RedBar = ({ h = 64 }: { h?: number }) => (
    <div className="w-[4px] rounded-full" style={{ height: h, backgroundColor: accent }} />
  );

  /* ═══════ COVER ═══════ */
  if (section.section_key === "cover") {
    return (
      <div className="relative w-full h-full overflow-hidden flex flex-col justify-end" style={{ fontFamily: FONT }}>
        {c.cover_image && <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: theme.cover.overlay(primary, colors.deep) }} />
{c.logo_url && (
          <img src={c.logo_url} alt="" className={`absolute top-14 ${theme.cover.logoPosition === "top-right" ? "right-16" : "left-16"} h-16 max-w-[200px] object-contain drop-shadow-lg`} />
        )}
        <div className="relative z-10 p-16 pb-24 flex items-end gap-8">
          <RedBar h={160} />
          <div className="space-y-5">
            <h1 className="slide-title text-white max-w-[1100px]" style={{ fontSize: theme.cover.titleSize, textTransform }}>{c.title}</h1>
            <p className="slide-label text-white/50">{[c.neighborhood, c.city].filter(Boolean).join(" — ")}</p>
            {c.broker_name && <p className="text-white/35 font-medium tracking-wide" style={{ fontSize: "20px" }}>{c.broker_name} · {c.agency_name}</p>}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ BROKER INTRO ═══════ */
  if (section.section_key === "broker_intro") {
    return (
      <div className="w-full h-full flex" style={{ fontFamily: FONT }}>
        <div className="flex-1 p-16 flex flex-col justify-center" style={{ backgroundColor: primary }}>
          <SlideLabel color="rgba(255,255,255,0.5)">Seu consultor</SlideLabel>
          <h2 className="slide-title text-white mt-5 mb-3" style={{ fontSize: "64px", textTransform }}>{c.name}</h2>
          {c.creci && <p className="text-white/30 tracking-widest mb-10" style={{ fontSize: "22px" }}>CRECI {c.creci}</p>}
          <div className="w-16 h-[3px] rounded-full mb-10" style={{ backgroundColor: accent }} />
          {c.short_bio && <p className="slide-body text-white/55 max-w-[550px]">{c.short_bio}</p>}
          {c.education && <p className="text-white/40 mt-4" style={{ fontSize: "24px" }}>🎓 {c.education}</p>}
          {c.service_regions && <p className="text-white/40 mt-3" style={{ fontSize: "24px" }}>📍 {c.service_regions}</p>}
          {c.vgv_summary && <p className="text-white/30 italic mt-8" style={{ fontSize: "22px" }}>{c.vgv_summary}</p>}
          <div className="flex gap-10 mt-12">
            {c.years_in_market && (
              <div>
                <p className="slide-metric text-white" style={{ fontSize: "56px" }}>{c.years_in_market}</p>
                <p className="slide-label text-white/40 mt-3">Anos</p>
              </div>
            )}
            {c.specialties && (
              <div>
                <p className="font-semibold text-white" style={{ fontSize: "26px" }}>{c.specialties}</p>
                <p className="slide-label text-white/40 mt-3">Especialidades</p>
              </div>
            )}
          </div>
        </div>
        {c.avatar_url && (
          <div className="w-[40%] relative">
            <img src={c.avatar_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-y-0 left-0 w-24" style={{ background: `linear-gradient(to right, ${primary}, transparent)` }} />
          </div>
        )}
      </div>
    );
  }

  /* ═══════ PROPERTY SUMMARY ═══════ */
  if (section.section_key === "property_summary") {
    return (
      <div className="w-full h-full" style={{ fontFamily: FONT, backgroundColor: neutral }}>
        <SlideImageGrid images={c.images} />
        <div className="p-16 space-y-8">
          <div>
            <SlideLabel color={accent}>O imóvel</SlideLabel>
            <h2 className="slide-title mt-4" style={{ fontSize: "56px", color: primary, textTransform }}>{section.title}</h2>
          </div>
          <SlideDivider theme={theme} colors={colors} />
          <SlideMetricRow
            items={[
              { label: "Área total", value: c.area_total ? `${c.area_total}m²` : null },
              { label: "Quartos", value: c.bedrooms },
              { label: "Suítes", value: c.suites },
              { label: "Vagas", value: c.parking_spots },
              { label: "Banheiros", value: c.bathrooms },
            ]}
            colors={colors}
            metricSize={theme.metric.size}
          />
          {c.highlights && <p className="slide-body max-w-[800px]" style={{ color: textMuted }}>{c.highlights}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ MARKET STUDY ═══════ */
  if (section.section_key === "market_study_placeholder" && c.status === "completed") {
    const sp = c.subject_property;
    const comps = c.comparables || [];
    return (
      <div className="w-full h-full bg-white p-16 overflow-hidden" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent}>Análise de mercado</SlideLabel>
        <h2 className="slide-title mt-4 mb-8" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
        <SlideDivider theme={theme} colors={colors} />

        {/* Subject Property Summary */}
        {sp && (
          <div className="mt-6 p-6 rounded-lg" style={{ backgroundColor: neutral }}>
            <p className="font-bold mb-3" style={{ fontSize: "22px", color: primary }}>Imóvel Avaliado</p>
            <div className="flex flex-wrap gap-x-10 gap-y-2" style={{ fontSize: "20px", color: textMuted }}>
              {sp.property_type && <span>{sp.property_type}</span>}
              {sp.construction_standard && <span>Padrão: {sp.construction_standard}</span>}
              {sp.conservation_state && <span>Conservação: {sp.conservation_state}</span>}
              {sp.property_age && <span>Idade: {sp.property_age}</span>}
              {sp.area_useful && <span>{sp.area_useful}m² útil</span>}
              {sp.bedrooms && <span>{sp.bedrooms} quartos</span>}
              {sp.suites && <span>{sp.suites} suítes</span>}
              {sp.parking_spots && <span>{sp.parking_spots} vagas</span>}
            </div>
            {sp.differentials?.length > 0 && (
              <p className="mt-2" style={{ fontSize: "18px", color: colors.textLight }}>
                Diferenciais: {sp.differentials.map((d: any) => typeof d === "string" ? d : d.label || d.name).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Market Stats */}
        <div className="mt-6">
          <MarketStats avgPrice={c.avg_price} medianPrice={c.median_price} avgPricePerSqm={c.avg_price_per_sqm} totalComparables={comps.length || c.comparables_count} compact primaryColor={primary} accentColor={accent} />
        </div>

        {/* Comparables Chart */}
        {comps.length > 0 && (
          <div className="mt-6">
            <MarketPriceBarChart comparables={comps} ownerExpectedPrice={c.owner_expected_price} compact primaryColor={primary} accentColor={accent} />
          </div>
        )}

        {/* Comparables Table */}
        {comps.length > 0 && (
          <div className="mt-6">
            <table className="w-full" style={{ fontSize: "17px" }}>
              <thead>
                <tr style={{ color: primary, borderBottom: `2px solid ${accent}` }}>
                  <th className="text-left py-2 font-bold">Comparável</th>
                  <th className="text-right py-2 font-bold">Preço</th>
                  <th className="text-right py-2 font-bold">m²</th>
                  <th className="text-right py-2 font-bold">R$/m²</th>
                  <th className="text-right py-2 font-bold">Score</th>
                </tr>
              </thead>
              <tbody>
                {comps.slice(0, 8).map((comp: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${neutral}`, color: textMuted }}>
                    <td className="py-2 truncate max-w-[350px]">{comp.title || comp.neighborhood || "—"}</td>
                    <td className="py-2 text-right font-medium" style={{ color: primary }}>
                      {comp.price ? `R$ ${Number(comp.price).toLocaleString("pt-BR")}` : "—"}
                    </td>
                    <td className="py-2 text-right">{comp.area || "—"}</td>
                    <td className="py-2 text-right">{comp.price_per_sqm ? `R$ ${Number(comp.price_per_sqm).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "—"}</td>
                    <td className="py-2 text-right">{comp.similarity_score ? `${Number(comp.similarity_score).toFixed(0)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  /* ═══════ PRICING SCENARIOS ═══════ */
  if (section.section_key === "pricing_scenarios") {
    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent}>Precificação</SlideLabel>
        <h2 className="slide-title mt-4 mb-4" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
        {c.owner_expected_price && (
          <p style={{ fontSize: "26px", color: textMuted }} className="mb-10">
            Valor pretendido: <span className="font-bold" style={{ color: primary }}>R$ {Number(c.owner_expected_price).toLocaleString("pt-BR")}</span>
          </p>
        )}
        <SlideDivider theme={theme} colors={colors} />
        <div className="mt-12">
          <SlideScenarios scenarios={c.scenarios || []} colors={colors} metricSize="72px" />
        </div>
      </div>
    );
  }

  /* ═══════ CLOSING ═══════ */
  if (section.section_key === "closing") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-20" style={{ background: theme.closing.background(primary, colors.deep), fontFamily: FONT }}>
        {c.logo_url && <img src={c.logo_url} alt="" className="h-20 object-contain mb-16 opacity-80" />}
        <div className="flex items-center gap-6 mb-12">
          <div className="h-px w-24" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-px w-24" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
        </div>
        <h2 className="slide-title text-white mb-6" style={{ fontSize: "64px" }}>{theme.closing.headline}</h2>
        <p className="text-white/40 font-light max-w-[600px] mb-16 leading-relaxed" style={{ fontSize: "28px" }}>{theme.closing.subline}</p>
        <p className="font-bold" style={{ fontSize: "48px", color: accent }}>{c.broker_name}</p>
        <div className="space-y-3 text-white/45 mt-5" style={{ fontSize: "26px" }}>
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
        {c.agency_name && <p className="text-white/25 mt-10 tracking-widest uppercase" style={{ fontSize: "22px" }}>{c.agency_name}</p>}
      </div>
    );
  }

  /* ═══════ OBJECTIVES ALIGNMENT ═══════ */
  if (section.section_key === "objectives_alignment") {
    const objectives = c.objectives || [];
    const iconMap: Record<string, any> = { key: Key, chart: BarChart3, checklist: ClipboardCheck };
    return (
      <div className="w-full h-full bg-white p-16 flex flex-col justify-center" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent}>Nosso compromisso</SlideLabel>
        <h2 className="slide-title mt-4 mb-12" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
        <SlideDivider theme={theme} colors={colors} />
        <div className="grid grid-cols-3 gap-12 mt-12">
          {objectives.map((obj: any, i: number) => {
            const Icon = iconMap[obj.icon] || Key;
            return (
              <div key={i} className="text-center space-y-6 p-10" style={{ backgroundColor: neutral, borderRadius: theme.card.borderRadius }}>
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: accent + "15" }}>
                  <Icon className="h-10 w-10" style={{ color: accent }} />
                </div>
                <h3 className="font-bold" style={{ fontSize: "28px", color: primary }}>{obj.title}</h3>
                {obj.description && <p className="leading-relaxed" style={{ fontSize: "24px", color: textMuted }}>{obj.description}</p>}
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
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent}>Por que nos escolher</SlideLabel>
        <h2 className="slide-title mt-4 mb-12" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
        <SlideDivider theme={theme} colors={colors} />
        <div className="grid grid-cols-3 gap-10 mb-14 mt-12">
          {props.map((p: any, i: number) => (
            <div key={i} className="border-l-[4px] pl-8 py-4" style={{ borderColor: accent }}>
              <h3 className="font-bold mb-4" style={{ fontSize: "28px", color: primary }}>{p.title}</h3>
              {p.description && <p className="leading-relaxed" style={{ fontSize: "24px", color: textMuted }}>{p.description}</p>}
            </div>
          ))}
        </div>
        <SlideStatBar
          items={[
            { label: "Países", value: stats.countries },
            { label: "Unidades", value: stats.units?.toLocaleString("pt-BR") },
            { label: "Corretores", value: stats.brokers?.toLocaleString("pt-BR") },
          ]}
          colors={colors}
          variant="dark"
          borderRadius={theme.card.borderRadius}
        />
      </div>
    );
  }

  /* ═══════ REQUIRED DOCUMENTATION ═══════ */
  if (section.section_key === "required_documentation") {
    const docs = c.documents || [];
    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <SlideLabel color={accent}>Documentação</SlideLabel>
        <h2 className="slide-title mt-4 mb-12" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
        <SlideDivider theme={theme} colors={colors} />
        <div className="space-y-6 mt-12">
          {docs.map((doc: any, i: number) => (
            <div key={i} className="flex items-center gap-6 p-6" style={{ backgroundColor: neutral, borderRadius: theme.card.borderRadius }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: doc.required ? accent + "15" : primary + "10" }}>
                {doc.required ? <CheckCircle className="h-7 w-7" style={{ color: accent }} /> : <FileText className="h-7 w-7" style={{ color: primary }} />}
              </div>
              <p className="font-semibold flex-1" style={{ fontSize: "26px", color: primary }}>{doc.title}</p>
              <span className="font-bold uppercase tracking-wider px-5 py-2 rounded-full" style={{
                fontSize: "18px",
                backgroundColor: doc.required ? accent + "15" : primary + "10",
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
      { label: stats.rank ? "Ranking" : null, value: stats.rank },
      { label: "Agências", value: stats.agencies },
      { label: "Corretores", value: stats.brokers },
      { label: "Franquias", value: stats.franchises },
    ].filter((s): s is { label: string; value: any } => !!s.label && !!s.value) : [];

    return (
      <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
        <div className="flex gap-10">
          <RedBar h={60} />
          <div className="flex-1 space-y-8">
            <div>
              <SlideLabel color={accent}>{section.section_key.replace(/_/g, " ")}</SlideLabel>
              <h2 className="slide-title mt-4" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
            </div>
            <SlideDivider theme={theme} colors={colors} />

            {(() => {
              const displayImage = c.branch_photo_url || c.image_url;
              const hasVisual = displayImage || (section.section_key === "about_national" && stats?.presence_states?.length);
              return (
                <div className={hasVisual ? "grid grid-cols-2 gap-12 items-start" : ""}>
                  <div className="space-y-6">
                    {c.text && <p className="slide-body whitespace-pre-wrap max-w-[650px]" style={{ color: textMuted }}>{c.text}</p>}
                    {stats?.presence_text && <p className="font-bold tracking-wider uppercase mt-4" style={{ fontSize: "24px", color: accent }}>{stats.presence_text}</p>}
                    {statItems.length > 0 && (
                      <div className="flex flex-wrap gap-6 mt-6">
                        {statItems.map((s, i) => (
                          <div key={i} className="px-8 py-5 rounded-lg text-center" style={{ backgroundColor: primary + "08" }}>
                             <p className="slide-metric" style={{ fontSize: "52px", color: primary }}>{typeof s.value === "number" ? s.value.toLocaleString("pt-BR") : s.value}</p>
                             <p className="uppercase tracking-wider mt-2" style={{ fontSize: "18px", color: colors.textLight }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.regional_numbers && (
                      <div className="flex flex-wrap gap-6 mt-6">
                        {c.regional_numbers.split("|").map((item: string, i: number) => (
                          <div key={i} className="px-8 py-5 rounded" style={{ backgroundColor: primary + "08" }}>
                            <p className="font-bold" style={{ fontSize: "26px", color: primary }}>{item.trim()}</p>
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
        </div>
      </div>
    );
  }

  /* ═══════ GENERIC ═══════ */
  return (
    <div className="w-full h-full bg-white p-16" style={{ fontFamily: FONT }}>
      <div className="flex gap-10">
        <RedBar h={60} />
        <div className="flex-1 space-y-8">
          <div>
            <SlideLabel color={accent}>{section.section_key.replace(/_/g, " ")}</SlideLabel>
            <h2 className="slide-title mt-4" style={{ fontSize: theme.heading.titleSize, color: primary, textTransform }}>{section.title}</h2>
          </div>
          <SlideDivider theme={theme} colors={colors} />

          {c.text && <p className="slide-body whitespace-pre-wrap max-w-[800px]" style={{ color: textMuted }}>{c.text}</p>}
          {c.image_url && <img src={c.image_url} alt="" className="max-h-[420px] object-cover w-full rounded-lg mt-6" />}
          {c.branch_photo_url && <img src={c.branch_photo_url} alt="" className="max-h-[420px] object-cover w-full rounded-lg mt-6" />}

          {c.actions && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-10">
              {c.actions.map((a: any, i: number) => (
                <div key={i}>
                  <div className="flex items-baseline gap-5">
                    <span className="slide-metric" style={{ fontSize: "36px", color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                    <h4 className="font-semibold" style={{ fontSize: "26px", color: primary }}>{a.title}</h4>
                  </div>
                  {a.description && <p className="mt-3 ml-14 leading-relaxed" style={{ fontSize: "22px", color: colors.textLight }}>{a.description}</p>}
                </div>
              ))}
            </div>
          )}

          {c.items && <SlideItemList items={c.items} colors={colors} />}

          {c.scenarios && <SlideScenarios scenarios={c.scenarios} colors={colors} metricSize="64px" />}

          {!c.text && !c.actions && !c.items && !c.scenarios && (
            <p className="italic" style={{ fontSize: "22px", color: "#D1D5DB" }}>Conteúdo não preenchido</p>
          )}
        </div>
      </div>
    </div>
  );
}

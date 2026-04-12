import { SectionData } from "./SectionRenderer";
import { MarketPriceBarChart, MarketStats } from "@/components/charts/MarketCharts";
import { BrazilPresenceMap } from "@/components/charts/BrazilPresenceMap";
import { Key, BarChart3, ClipboardCheck, FileText, CheckCircle } from "lucide-react";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

const FONT = "'Gotham', 'Montserrat', sans-serif";
const BLUE = "#003DA5";
const DEEP = "#001F5C";
const RED = "#DC1431";

export function LayoutImpactoComercial({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || BLUE;
  const accent = branding?.secondary_color || RED;

  const SectionLabel = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
    <p className="slide-label font-bold" style={{ color: light ? "rgba(255,255,255,0.5)" : accent }}>{children}</p>
  );

  /* ═══════ COVER ═══════ */
  if (section.section_key === "cover") {
    return (
      <div className="relative min-h-[500px] overflow-hidden flex flex-col justify-end text-white" style={{ fontFamily: FONT }}>
        {c.cover_image && <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 5%, ${DEEP}99 40%, ${DEEP} 100%)` }} />
        {c.logo_url && <img src={c.logo_url} alt="" className="absolute top-6 right-8 h-8 object-contain opacity-80" />}
        <div className="relative z-10 p-10 pb-12">
          <div className="w-16 h-1 mb-5" style={{ backgroundColor: accent }} />
          <h1 className="slide-title text-[52px] text-white uppercase leading-[1] max-w-lg">{c.title}</h1>
          <p className="text-[13px] font-bold tracking-[0.3em] uppercase mt-5" style={{ color: accent }}>{[c.neighborhood, c.city].filter(Boolean).join(" · ")}</p>
          {c.broker_name && <p className="text-[12px] text-white/35 mt-3 tracking-wide">{c.broker_name} | {c.agency_name}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ BROKER INTRO ═══════ */
  if (section.section_key === "broker_intro") {
    return (
      <div className="min-h-[500px] bg-white flex" style={{ fontFamily: FONT }}>
        <div className="flex-1 p-10 flex flex-col justify-center">
          <SectionLabel>Seu consultor</SectionLabel>
          <h2 className="slide-title text-[38px] mt-3 uppercase" style={{ color: primary }}>{c.name}</h2>
          {c.creci && <p className="text-[11px] tracking-[0.25em] mt-1 mb-6" style={{ color: "#9CA3AF" }}>CRECI {c.creci}</p>}
          <div className="w-10 h-1 mb-5" style={{ backgroundColor: accent }} />
          {c.short_bio && <p className="slide-body max-w-sm" style={{ color: "#6B7280" }}>{c.short_bio}</p>}
          {c.education && <p className="text-[12px] mt-2" style={{ color: "#9CA3AF" }}>🎓 {c.education}</p>}
          {c.service_regions && <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>📍 {c.service_regions}</p>}
          <div className="flex gap-5 mt-8">
            {c.years_in_market && (
              <div className="px-6 py-4 text-white" style={{ backgroundColor: accent }}>
                <p className="slide-metric text-[28px]">{c.years_in_market}</p>
                <p className="text-[9px] uppercase tracking-[0.25em] opacity-80 mt-1">Anos</p>
              </div>
            )}
            {c.specialties && (
              <div className="px-6 py-4 border-2" style={{ borderColor: primary, color: primary }}>
                <p className="text-[13px] font-bold">{c.specialties}</p>
                <p className="text-[9px] uppercase tracking-[0.25em] opacity-50 mt-1">Especialidade</p>
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
      <div className="min-h-[500px] bg-white" style={{ fontFamily: FONT }}>
        {c.images?.length > 0 && <img src={c.images[0]} alt="" className="w-full h-56 object-cover" />}
        <div className="p-10 space-y-5">
          <SectionLabel>O imóvel</SectionLabel>
          <h2 className="slide-title text-[32px] uppercase" style={{ color: primary }}>{c.title || section.title}</h2>
          <div className="w-10 h-1" style={{ backgroundColor: accent }} />
          <div className="flex gap-8 py-2">
            {[
              { label: "M²", value: c.area_total },
              { label: "QUARTOS", value: c.bedrooms },
              { label: "SUÍTES", value: c.suites },
              { label: "VAGAS", value: c.parking_spots },
            ].filter(i => i.value).map((item, i) => (
              <div key={i}>
                <p className="slide-metric text-[34px]" style={{ color: primary }}>{item.value}</p>
                <p className="slide-label" style={{ color: "#9CA3AF" }}>{item.label}</p>
              </div>
            ))}
          </div>
          {c.highlights && (
            <p className="slide-body border-l-4 pl-5" style={{ borderColor: accent, color: "#6B7280" }}>{c.highlights}</p>
          )}
        </div>
      </div>
    );
  }

  /* ═══════ DIFFERENTIALS ═══════ */
  if (section.section_key === "differentials") {
    return (
      <div className="min-h-[500px] text-white p-10" style={{ backgroundColor: DEEP, fontFamily: FONT }}>
        <SectionLabel light>Por que nos escolher</SectionLabel>
        <h2 className="slide-title text-[30px] text-white uppercase mt-2 mb-8">{section.title || "Nossos diferenciais"}</h2>
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-white/10 last:border-0">
              <span className="slide-metric text-[24px] shrink-0" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h4 className="font-bold text-[14px]" style={{ color: accent }}>{item.title}</h4>
                {item.description && <p className="text-[12px] text-white/45 mt-1 leading-relaxed">{item.description}</p>}
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
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <SectionLabel>Resultados comprovados</SectionLabel>
        <h2 className="slide-title text-[28px] uppercase mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <div className="flex gap-6 mb-8">
          {(c.items || []).slice(0, 3).map((item: any, i: number) => (
            <div key={i} className="flex-1 py-6 text-center" style={{ backgroundColor: primary + "08" }}>
              {item.metric_value && <p className="slide-metric text-[38px]" style={{ color: accent }}>{item.metric_value}</p>}
              <p className="text-[12px] font-bold mt-2 uppercase tracking-[0.2em]" style={{ color: primary }}>{item.title}</p>
            </div>
          ))}
        </div>
        {c.testimonials?.length > 0 && (
          <div className="space-y-4">
            {c.testimonials.slice(0, 2).map((t: any, i: number) => (
              <div key={i} className="py-5 border-t border-gray-100">
                <p className="slide-body italic" style={{ color: "#6B7280" }}>"{t.content}"</p>
                <p className="text-[13px] font-bold mt-3" style={{ color: primary }}>{t.author_name}</p>
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
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <SectionLabel>Análise de mercado</SectionLabel>
        <h2 className="slide-title text-[28px] uppercase mt-2 mb-6" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-1 mb-6" style={{ backgroundColor: accent }} />
        <MarketStats avgPrice={c.avg_price} medianPrice={c.median_price} avgPricePerSqm={c.avg_price_per_sqm} totalComparables={c.comparables.length} compact primaryColor={primary} accentColor={accent} />
        <div className="mt-6">
          <MarketPriceBarChart comparables={c.comparables} ownerExpectedPrice={c.owner_expected_price} compact primaryColor={primary} accentColor={accent} />
        </div>
      </div>
    );
  }

  /* ═══════ CLOSING ═══════ */
  if (section.section_key === "closing") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center text-white p-12" style={{ backgroundColor: DEEP, fontFamily: FONT }}>
        {c.logo_url && <img src={c.logo_url} alt="" className="h-12 object-contain mb-10 opacity-70" />}
        <h2 className="slide-title text-[38px] text-white uppercase mb-3">Vamos fechar negócio?</h2>
        <p className="text-white/35 text-[14px] font-light mb-8">Entre em contato agora mesmo.</p>
        <div className="px-10 py-4 text-[18px] font-bold tracking-wider text-white" style={{ backgroundColor: accent }}>
          {c.broker_name}
        </div>
        <div className="space-y-1 text-[13px] text-white/40 mt-6">
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
      <div className="min-h-[500px] bg-white p-10 flex flex-col justify-center" style={{ fontFamily: FONT }}>
        <SectionLabel>Nosso compromisso</SectionLabel>
        <h2 className="slide-title text-[28px] uppercase mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-1 mb-8" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-3 gap-6">
          {objectives.map((obj: any, i: number) => {
            const Icon = iconMap[obj.icon] || Key;
            return (
              <div key={i} className="text-center space-y-4 p-6" style={{ backgroundColor: primary + "06" }}>
                <div className="mx-auto w-14 h-14 flex items-center justify-center" style={{ backgroundColor: accent }}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-[15px] uppercase tracking-wider" style={{ color: primary }}>{obj.title}</h3>
                {obj.description && <p className="text-[12px] leading-relaxed" style={{ color: "#6B7280" }}>{obj.description}</p>}
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
      <div className="min-h-[500px] text-white p-10" style={{ backgroundColor: DEEP, fontFamily: FONT }}>
        <SectionLabel light>Proposta de valor</SectionLabel>
        <h2 className="slide-title text-[28px] text-white uppercase mt-2 mb-8">{section.title}</h2>
        <div className="w-10 h-1 mb-8" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-3 gap-6 mb-10">
          {props.map((p: any, i: number) => (
            <div key={i} className="py-4 border-t-2" style={{ borderColor: accent }}>
              <h3 className="font-bold text-[15px] uppercase tracking-wider mb-2" style={{ color: accent }}>{p.title}</h3>
              {p.description && <p className="text-[12px] leading-relaxed text-white/50">{p.description}</p>}
            </div>
          ))}
        </div>
        {(stats.countries > 0 || stats.units > 0 || stats.brokers > 0) && (
          <div className="flex gap-6">
            {[
              { label: "PAÍSES", value: stats.countries },
              { label: "UNIDADES", value: stats.units?.toLocaleString("pt-BR") },
              { label: "CORRETORES", value: stats.brokers?.toLocaleString("pt-BR") },
            ].filter(s => s.value && s.value !== "0").map((s, i) => (
              <div key={i} className="flex-1 text-center py-6" style={{ backgroundColor: accent }}>
                <p className="slide-metric text-[34px] text-white">{s.value}</p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/80 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ═══════ REQUIRED DOCUMENTATION ═══════ */
  if (section.section_key === "required_documentation") {
    const docs = c.documents || [];
    return (
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <SectionLabel>Documentação</SectionLabel>
        <h2 className="slide-title text-[28px] uppercase mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-1 mb-8" style={{ backgroundColor: accent }} />
        <div className="space-y-3">
          {docs.map((doc: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
              <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: doc.required ? accent : primary + "15" }}>
                {doc.required ? <CheckCircle className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5" style={{ color: primary }} />}
              </div>
              <p className="font-bold text-[14px] flex-1 uppercase tracking-wider" style={{ color: primary }}>{doc.title}</p>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1" style={{
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
    ].filter(s => s.label && s.value) : [];

    return (
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <SectionLabel>{section.section_key.replace(/_/g, " ")}</SectionLabel>
        <h2 className="slide-title text-[28px] uppercase mt-2 mb-4" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-1 mb-6" style={{ backgroundColor: accent }} />

        {(() => {
          const displayImage = c.branch_photo_url || c.image_url;
          const hasVisual = displayImage || (section.section_key === "about_national" && stats?.presence_states?.length);
          return (
            <div className={hasVisual ? "grid grid-cols-2 gap-8 items-start" : ""}>
              <div className="space-y-4">
                {c.text && <p className="slide-body whitespace-pre-wrap max-w-xl" style={{ color: "#6B7280" }}>{c.text}</p>}
                {stats?.presence_text && <p className="text-[13px] font-bold tracking-[0.25em] uppercase mt-2" style={{ color: accent }}>{stats.presence_text}</p>}
                {statItems.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {statItems.map((s, i) => (
                      <div key={i} className="px-5 py-4 text-center" style={{ backgroundColor: primary + "08" }}>
                        <p className="slide-metric text-[26px]" style={{ color: primary }}>{typeof s.value === "number" ? s.value.toLocaleString("pt-BR") : s.value}</p>
                        <p className="text-[9px] uppercase tracking-[0.25em] mt-1" style={{ color: "#9CA3AF" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {c.regional_numbers && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {c.regional_numbers.split("|").map((item: string, i: number) => (
                      <div key={i} className="px-5 py-3" style={{ backgroundColor: accent + "12" }}>
                        <p className="font-bold text-[15px]" style={{ color: primary }}>{item.trim()}</p>
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
                  {displayImage && <img src={displayImage} alt="" className="max-h-56 object-cover w-full rounded-lg" />}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  /* ═══════ GENERIC ═══════ */
  return (
    <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
      <SectionLabel>{section.section_key.replace(/_/g, " ")}</SectionLabel>
      <h2 className="slide-title text-[28px] uppercase mt-2 mb-4" style={{ color: primary }}>{section.title}</h2>
      <div className="w-10 h-1 mb-6" style={{ backgroundColor: accent }} />

      {c.text && <p className="slide-body whitespace-pre-wrap max-w-xl" style={{ color: "#6B7280" }}>{c.text}</p>}
      {c.image_url && <img src={c.image_url} alt="" className="max-h-64 object-cover w-full rounded-lg mt-4" />}
      {c.branch_photo_url && <img src={c.branch_photo_url} alt="" className="max-h-64 object-cover w-full rounded-lg mt-4" />}

      {c.actions && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {c.actions.map((a: any, i: number) => (
            <div key={i} className="py-3 border-b border-gray-100">
              <div className="flex items-baseline gap-3">
                <span className="slide-metric text-[20px]" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                <h4 className="font-bold text-[14px] uppercase tracking-wider" style={{ color: primary }}>{a.title}</h4>
              </div>
              {a.description && <p className="text-[12px] mt-1 ml-10 leading-relaxed" style={{ color: "#9CA3AF" }}>{a.description}</p>}
            </div>
          ))}
        </div>
      )}

      {c.items && (
        <div className="space-y-4">
          {c.items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
              <span className="slide-metric text-[20px] shrink-0" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h4 className="font-bold text-[14px]" style={{ color: primary }}>{item.title || item.author_name}</h4>
                <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#9CA3AF" }}>{item.description || item.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {c.scenarios && (
        <div className="flex mt-4">
          {c.scenarios.map((s: any, i: number) => {
            const colors = [accent, primary, "#16a34a"];
            return (
              <div key={i} className="flex-1 text-center py-8 relative">
                {i > 0 && <div className="absolute left-0 top-4 bottom-4 w-px" style={{ backgroundColor: accent + "22" }} />}
                <p className="slide-label mb-3" style={{ color: "#9CA3AF" }}>{s.label}</p>
                <p className="slide-metric text-[36px]" style={{ color: colors[i] }}>
                  {s.value ? `R$ ${Number(s.value).toLocaleString("pt-BR")}` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!c.text && !c.actions && !c.items && !c.scenarios && (
        <p className="text-[14px] italic" style={{ color: "#D1D5DB" }}>Conteúdo não preenchido</p>
      )}
    </div>
  );
}

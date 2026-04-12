import { SectionData } from "./SectionRenderer";
import { MarketPriceBarChart, MarketStats } from "@/components/charts/MarketCharts";
import { BrazilPresenceMap } from "@/components/charts/BrazilPresenceMap";
import { Key, BarChart3, ClipboardCheck, FileText, CheckCircle, Globe, Building2, Users } from "lucide-react";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

const FONT = "'Gotham', 'Montserrat', sans-serif";
const BLUE = "#003DA5";
const RED = "#DC1431";
const NEUTRAL = "#F5F6F8";

export function LayoutExecutivo({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || BLUE;
  const accent = branding?.secondary_color || RED;

  const SectionLabel = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
    <p className="slide-label" style={{ color: light ? "rgba(255,255,255,0.5)" : accent }}>{children}</p>
  );

  const RedBar = ({ h = 64 }: { h?: number }) => (
    <div className="w-[3px] rounded-full" style={{ height: h, backgroundColor: accent }} />
  );

  /* ═══════ COVER ═══════ */
  if (section.section_key === "cover") {
    return (
      <div className="relative min-h-[500px] overflow-hidden flex flex-col justify-end" style={{ fontFamily: FONT }}>
        {c.cover_image && <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${primary} 0%, ${primary}dd 35%, ${primary}66 65%, ${primary}22 100%)` }} />
        {c.logo_url && <img src={c.logo_url} alt="" className="absolute top-8 left-10 h-10 object-contain drop-shadow-lg" />}
        <div className="relative z-10 p-10 pb-14 flex items-end gap-5">
          <RedBar h={96} />
          <div className="space-y-3">
            <h1 className="slide-title text-[48px] text-white max-w-lg">{c.title}</h1>
            <p className="slide-label text-white/50">{[c.neighborhood, c.city].filter(Boolean).join(" — ")}</p>
            {c.broker_name && <p className="text-[12px] text-white/35 font-medium tracking-wide">{c.broker_name} · {c.agency_name}</p>}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ BROKER INTRO ═══════ */
  if (section.section_key === "broker_intro") {
    return (
      <div className="min-h-[500px] flex" style={{ fontFamily: FONT }}>
        <div className="flex-1 p-10 flex flex-col justify-center" style={{ backgroundColor: primary }}>
          <SectionLabel light>Seu consultor</SectionLabel>
          <h2 className="slide-title text-[38px] text-white mt-3 mb-1">{c.name}</h2>
          {c.creci && <p className="text-[11px] text-white/30 tracking-widest mb-6">CRECI {c.creci}</p>}
          <div className="w-10 h-[2px] rounded-full mb-6" style={{ backgroundColor: accent }} />
          {c.short_bio && <p className="slide-body text-white/55 max-w-sm">{c.short_bio}</p>}
          {c.education && <p className="text-[12px] text-white/40 mt-2">🎓 {c.education}</p>}
          {c.service_regions && <p className="text-[12px] text-white/40 mt-1">📍 {c.service_regions}</p>}
          {c.vgv_summary && <p className="text-[12px] text-white/30 italic mt-4">{c.vgv_summary}</p>}
          <div className="flex gap-6 mt-8">
            {c.years_in_market && (
              <div>
                <p className="slide-metric text-[28px] text-white">{c.years_in_market}</p>
                <p className="slide-label text-white/40 mt-1">Anos</p>
              </div>
            )}
            {c.specialties && (
              <div>
                <p className="text-[13px] font-semibold text-white">{c.specialties}</p>
                <p className="slide-label text-white/40 mt-1">Especialidades</p>
              </div>
            )}
          </div>
        </div>
        {c.avatar_url && (
          <div className="w-[40%] relative">
            <img src={c.avatar_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-y-0 left-0 w-20" style={{ background: `linear-gradient(to right, ${primary}, transparent)` }} />
          </div>
        )}
      </div>
    );
  }

  /* ═══════ PROPERTY SUMMARY ═══════ */
  if (section.section_key === "property_summary") {
    return (
      <div className="min-h-[500px]" style={{ fontFamily: FONT, backgroundColor: NEUTRAL }}>
        {c.images?.length > 0 && (
          <div className="flex gap-[2px]">
            <img src={c.images[0]} alt="" className="flex-[2] h-56 object-cover" />
            {c.images.length > 1 && (
              <div className="flex-1 flex flex-col gap-[2px]">
                {c.images.slice(1, 3).map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="flex-1 w-full object-cover" />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-10 space-y-6">
          <div>
            <SectionLabel>O imóvel</SectionLabel>
            <h2 className="slide-title text-[32px] mt-2" style={{ color: primary }}>{section.title}</h2>
          </div>
          <div className="w-10 h-[2px]" style={{ backgroundColor: accent }} />
          <div className="flex gap-10">
            {[
              { label: "Área total", value: c.area_total ? `${c.area_total}m²` : null },
              { label: "Quartos", value: c.bedrooms },
              { label: "Suítes", value: c.suites },
              { label: "Vagas", value: c.parking_spots },
              { label: "Banheiros", value: c.bathrooms },
            ].filter(i => i.value).map((item, i) => (
              <div key={i}>
                <p className="slide-metric text-[30px]" style={{ color: primary }}>{item.value}</p>
                <p className="slide-label mt-1" style={{ color: "#6B7280" }}>{item.label}</p>
              </div>
            ))}
          </div>
          {c.highlights && <p className="slide-body max-w-xl" style={{ color: "#6B7280" }}>{c.highlights}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ MARKET STUDY ═══════ */
  if (section.section_key === "market_study_placeholder" && c.comparables?.length > 0) {
    return (
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <SectionLabel>Análise de mercado</SectionLabel>
        <h2 className="slide-title text-[28px] mt-2 mb-6" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-[2px] mb-6" style={{ backgroundColor: accent }} />
        <MarketStats avgPrice={c.avg_price} medianPrice={c.median_price} avgPricePerSqm={c.avg_price_per_sqm} totalComparables={c.comparables.length} compact primaryColor={primary} accentColor={accent} />
        <div className="mt-6">
          <MarketPriceBarChart comparables={c.comparables} ownerExpectedPrice={c.owner_expected_price} compact primaryColor={primary} accentColor={accent} />
        </div>
      </div>
    );
  }

  /* ═══════ PRICING SCENARIOS ═══════ */
  if (section.section_key === "pricing_scenarios") {
    return (
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <SectionLabel>Precificação</SectionLabel>
        <h2 className="slide-title text-[28px] mt-2 mb-2" style={{ color: primary }}>{section.title}</h2>
        {c.owner_expected_price && (
          <p className="text-[13px] mb-6" style={{ color: "#6B7280" }}>
            Valor pretendido: <span className="font-bold" style={{ color: primary }}>R$ {Number(c.owner_expected_price).toLocaleString("pt-BR")}</span>
          </p>
        )}
        <div className="w-10 h-[2px] mb-8" style={{ backgroundColor: accent }} />
        <div className="flex">
          {(c.scenarios || []).map((s: any, i: number) => {
            const colors = [accent, primary, "#16a34a"];
            return (
              <div key={i} className="flex-1 text-center py-8 relative">
                {i > 0 && <div className="absolute left-0 top-4 bottom-4 w-px" style={{ backgroundColor: accent + "22" }} />}
                <p className="slide-label mb-3" style={{ color: "#9CA3AF" }}>{s.label}</p>
                <p className="slide-metric text-[38px]" style={{ color: colors[i] }}>
                  {s.value ? `R$ ${Number(s.value).toLocaleString("pt-BR")}` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════ CLOSING ═══════ */
  if (section.section_key === "closing") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center text-white p-12" style={{ backgroundColor: primary, fontFamily: FONT }}>
        {c.logo_url && <img src={c.logo_url} alt="" className="h-12 object-contain mb-10 opacity-80" />}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-px w-16" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
        </div>
        <h2 className="slide-title text-[36px] text-white mb-4">Obrigado pela confiança</h2>
        <p className="text-white/40 text-[14px] font-light max-w-sm mb-10 leading-relaxed">Estou à disposição para transformar este imóvel em um excelente negócio.</p>
        <p className="text-[22px] font-bold" style={{ color: accent }}>{c.broker_name}</p>
        <div className="space-y-1 text-[13px] text-white/45 mt-3">
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
        {c.agency_name && <p className="text-[11px] text-white/25 mt-6 tracking-widest uppercase">{c.agency_name}</p>}
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
        <h2 className="slide-title text-[28px] mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-[2px] mb-8" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-3 gap-8">
          {objectives.map((obj: any, i: number) => {
            const Icon = iconMap[obj.icon] || Key;
            return (
              <div key={i} className="text-center space-y-4 p-6 rounded-lg" style={{ backgroundColor: NEUTRAL }}>
                <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: accent + "15" }}>
                  <Icon className="h-7 w-7" style={{ color: accent }} />
                </div>
                <h3 className="font-bold text-[15px]" style={{ color: primary }}>{obj.title}</h3>
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
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <SectionLabel>Por que nos escolher</SectionLabel>
        <h2 className="slide-title text-[28px] mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-[2px] mb-8" style={{ backgroundColor: accent }} />
        <div className="grid grid-cols-3 gap-6 mb-10">
          {props.map((p: any, i: number) => (
            <div key={i} className="border-l-[3px] pl-5 py-2" style={{ borderColor: accent }}>
              <h3 className="font-bold text-[15px] mb-2" style={{ color: primary }}>{p.title}</h3>
              {p.description && <p className="text-[12px] leading-relaxed" style={{ color: "#6B7280" }}>{p.description}</p>}
            </div>
          ))}
        </div>
        {(stats.countries > 0 || stats.units > 0 || stats.brokers > 0) && (
          <div className="flex gap-8 p-6 rounded-lg" style={{ backgroundColor: primary }}>
            {[
              { label: "Países", value: stats.countries },
              { label: "Unidades", value: stats.units?.toLocaleString("pt-BR") },
              { label: "Corretores", value: stats.brokers?.toLocaleString("pt-BR") },
            ].filter(s => s.value && s.value !== "0").map((s, i) => (
              <div key={i} className="text-center flex-1">
                <p className="slide-metric text-[32px] text-white">{s.value}</p>
                <p className="slide-label text-white/45 mt-1">{s.label}</p>
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
        <h2 className="slide-title text-[28px] mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <div className="w-10 h-[2px] mb-8" style={{ backgroundColor: accent }} />
        <div className="space-y-4">
          {docs.map((doc: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: NEUTRAL }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: doc.required ? accent + "15" : primary + "10" }}>
                {doc.required ? <CheckCircle className="h-5 w-5" style={{ color: accent }} /> : <FileText className="h-5 w-5" style={{ color: primary }} />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[14px]" style={{ color: primary }}>{doc.title}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{
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
    ].filter(s => s.label && s.value) : [];

    return (
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
        <div className="flex gap-6">
          <RedBar h={40} />
          <div className="flex-1 space-y-6">
            <div>
              <SectionLabel>{section.section_key.replace(/_/g, " ")}</SectionLabel>
              <h2 className="slide-title text-[28px] mt-2" style={{ color: primary }}>{section.title}</h2>
            </div>
            <div className="w-10 h-[2px]" style={{ backgroundColor: accent }} />

            {(() => {
              const displayImage = c.branch_photo_url || c.image_url;
              const hasVisual = displayImage || (section.section_key === "about_national" && stats?.presence_states?.length);
              return (
                <div className={hasVisual ? "grid grid-cols-2 gap-8 items-start" : ""}>
                  <div className="space-y-4">
                    {c.text && <p className="slide-body whitespace-pre-wrap max-w-xl" style={{ color: "#6B7280" }}>{c.text}</p>}
                    {stats?.presence_text && <p className="text-[13px] font-bold tracking-wider uppercase mt-2" style={{ color: accent }}>{stats.presence_text}</p>}
                    {statItems.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-4">
                        {statItems.map((s, i) => (
                          <div key={i} className="px-5 py-3 rounded-lg text-center" style={{ backgroundColor: primary + "08" }}>
                            <p className="slide-metric text-[24px]" style={{ color: primary }}>{typeof s.value === "number" ? s.value.toLocaleString("pt-BR") : s.value}</p>
                            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "#9CA3AF" }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.regional_numbers && (
                      <div className="flex flex-wrap gap-4 mt-4">
                        {c.regional_numbers.split("|").map((item: string, i: number) => (
                          <div key={i} className="px-5 py-3 rounded" style={{ backgroundColor: primary + "08" }}>
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
        </div>
      </div>
    );
  }

  /* ═══════ GENERIC ═══════ */
  return (
    <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
      <div className="flex gap-6">
        <RedBar h={40} />
        <div className="flex-1 space-y-6">
          <div>
            <SectionLabel>{section.section_key.replace(/_/g, " ")}</SectionLabel>
            <h2 className="slide-title text-[28px] mt-2" style={{ color: primary }}>{section.title}</h2>
          </div>
          <div className="w-10 h-[2px]" style={{ backgroundColor: accent }} />

          {c.text && <p className="slide-body whitespace-pre-wrap max-w-xl" style={{ color: "#6B7280" }}>{c.text}</p>}
          {c.image_url && <img src={c.image_url} alt="" className="max-h-64 object-cover w-full rounded-lg mt-4" />}
          {c.branch_photo_url && <img src={c.branch_photo_url} alt="" className="max-h-64 object-cover w-full rounded-lg mt-4" />}

          {c.actions && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {c.actions.map((a: any, i: number) => (
                <div key={i}>
                  <div className="flex items-baseline gap-3">
                    <span className="slide-metric text-[20px]" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                    <h4 className="font-semibold text-[14px]" style={{ color: primary }}>{a.title}</h4>
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
                    <h4 className="font-semibold text-[14px]" style={{ color: primary }}>{item.title || item.author_name}</h4>
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
                  <div key={i} className="flex-1 text-center py-6 relative">
                    {i > 0 && <div className="absolute left-0 top-4 bottom-4 w-px" style={{ backgroundColor: accent + "22" }} />}
                    <p className="slide-label mb-2" style={{ color: "#9CA3AF" }}>{s.label}</p>
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
      </div>
    </div>
  );
}

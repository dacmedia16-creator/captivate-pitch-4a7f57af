import { SectionData } from "./SectionRenderer";
import { MarketPriceBarChart, MarketStats } from "@/components/charts/MarketCharts";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

export function LayoutExecutivo({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || "#1e3a5f";
  const gold = branding?.secondary_color || "#c9a84c";

  /* ─── Primitives ─── */
  const AccentBar = ({ height = "h-16" }: { height?: string }) => (
    <div className={`w-[3px] ${height} rounded-full`} style={{ backgroundColor: gold }} />
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="slide-label" style={{ color: gold }}>{children}</p>
  );

  const EditorialDivider = () => (
    <div className="editorial-divider w-full" style={{ backgroundColor: primary }} />
  );

  /* ═══════ COVER ═══════ */
  if (section.section_key === "cover") {
    return (
      <div className="relative min-h-[500px] overflow-hidden flex flex-col justify-end" style={{ fontFamily: "'Inter', sans-serif" }}>
        {c.cover_image && <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${primary} 0%, ${primary}cc 40%, ${primary}44 70%, transparent 100%)` }} />
        {c.logo_url && (
          <img src={c.logo_url} alt="" className="absolute top-8 left-10 h-10 object-contain opacity-90" />
        )}
        <div className="relative z-10 p-10 pb-12 flex items-end gap-5">
          <AccentBar height="h-24" />
          <div className="space-y-3">
            <h1 className="slide-title text-[44px] text-white">{c.title}</h1>
            <p className="slide-label text-white/60">{[c.neighborhood, c.city].filter(Boolean).join(" — ")}</p>
            {c.broker_name && (
              <p className="text-[13px] text-white/40 font-light">{c.broker_name} · {c.agency_name}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ BROKER INTRO ═══════ */
  if (section.section_key === "broker_intro") {
    return (
      <div className="min-h-[500px] bg-white flex" style={{ fontFamily: "'Inter', sans-serif" }}>
        {c.avatar_url && (
          <div className="w-[38%] relative overflow-hidden">
            <img src={c.avatar_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to right, transparent 60%, white 100%)` }} />
          </div>
        )}
        <div className={`flex-1 p-10 flex flex-col justify-center ${!c.avatar_url ? "px-16" : ""}`}>
          <SectionLabel>Seu consultor</SectionLabel>
          <h2 className="slide-title text-[36px] mt-3 mb-4" style={{ color: primary }}>{c.name}</h2>
          {c.creci && <p className="text-[11px] text-gray-400 tracking-wider mb-4">CRECI {c.creci}</p>}
          <EditorialDivider />
          {c.short_bio && <p className="slide-body text-gray-500 mt-5 max-w-md">{c.short_bio}</p>}
          {c.vgv_summary && <p className="text-[12px] text-gray-400 italic mt-4">{c.vgv_summary}</p>}
          <div className="flex gap-8 mt-8">
            {c.years_in_market && (
              <div>
                <p className="slide-metric text-2xl" style={{ color: primary }}>{c.years_in_market}</p>
                <p className="slide-label text-gray-400 mt-1">Anos de mercado</p>
              </div>
            )}
            {c.specialties && (
              <div>
                <p className="text-[13px] font-medium" style={{ color: primary }}>{c.specialties}</p>
                <p className="slide-label text-gray-400 mt-1">Especialidades</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ PROPERTY SUMMARY ═══════ */
  if (section.section_key === "property_summary") {
    return (
      <div className="min-h-[500px] bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
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
          <EditorialDivider />
          <div className="flex gap-10">
            {[
              { label: "Área total", value: c.area_total ? `${c.area_total}m²` : null },
              { label: "Quartos", value: c.bedrooms },
              { label: "Suítes", value: c.suites },
              { label: "Vagas", value: c.parking_spots },
              { label: "Banheiros", value: c.bathrooms },
            ].filter(i => i.value).map((item, i) => (
              <div key={i}>
                <p className="slide-metric text-[28px]" style={{ color: primary }}>{item.value}</p>
                <p className="slide-label text-gray-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          {c.highlights && <p className="slide-body text-gray-500 max-w-xl">{c.highlights}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ MARKET STUDY ═══════ */
  if (section.section_key === "market_study_placeholder" && c.comparables?.length > 0) {
    return (
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        <SectionLabel>Análise de mercado</SectionLabel>
        <h2 className="slide-title text-[28px] mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <EditorialDivider />
        <div className="mt-6">
          <MarketStats avgPrice={c.avg_price} medianPrice={c.median_price} avgPricePerSqm={c.avg_price_per_sqm} totalComparables={c.comparables.length} compact primaryColor={primary} accentColor={gold} />
        </div>
        <div className="mt-6">
          <MarketPriceBarChart comparables={c.comparables} ownerExpectedPrice={c.owner_expected_price} compact primaryColor={primary} accentColor={gold} />
        </div>
      </div>
    );
  }

  /* ═══════ PRICING SCENARIOS ═══════ */
  if (section.section_key === "pricing_scenarios") {
    return (
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        <SectionLabel>Precificação</SectionLabel>
        <h2 className="slide-title text-[28px] mt-2 mb-2" style={{ color: primary }}>{section.title}</h2>
        {c.owner_expected_price && (
          <p className="text-[13px] text-gray-400 mb-8">Valor pretendido: <span className="font-semibold" style={{ color: primary }}>R$ {Number(c.owner_expected_price).toLocaleString("pt-BR")}</span></p>
        )}
        <EditorialDivider />
        <div className="flex mt-8">
          {(c.scenarios || []).map((s: any, i: number) => {
            const colors = ["#dc2626", primary, "#16a34a"];
            return (
              <div key={i} className="flex-1 text-center py-8 relative">
                {i > 0 && <div className="absolute left-0 top-4 bottom-4 w-px bg-gray-100" />}
                <p className="slide-label text-gray-400 mb-3">{s.label}</p>
                <p className="slide-metric text-[36px]" style={{ color: colors[i] }}>
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
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center text-white p-12" style={{ background: `linear-gradient(160deg, ${primary}, ${primary}dd)`, fontFamily: "'Inter', sans-serif" }}>
        {c.logo_url && <img src={c.logo_url} alt="" className="h-12 object-contain mb-10 opacity-80" />}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: gold + "66" }} />
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: gold }} />
          <div className="h-px w-16" style={{ backgroundColor: gold + "66" }} />
        </div>
        <h2 className="slide-title text-[36px] text-white mb-4">Obrigado pela confiança</h2>
        <p className="text-white/50 text-[14px] font-light max-w-sm mb-10 leading-relaxed">Estou à disposição para transformar este imóvel em um excelente negócio.</p>
        <p className="text-[20px] font-semibold" style={{ color: gold }}>{c.broker_name}</p>
        <div className="space-y-1 text-[13px] text-white/50 mt-3">
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
        {c.agency_name && <p className="text-[11px] text-white/30 mt-6">{c.agency_name}</p>}
      </div>
    );
  }

  /* ═══════ GENERIC CONTENT ═══════ */
  return (
    <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex gap-8">
        <div className="w-1 shrink-0 rounded-full" style={{ backgroundColor: gold + "33" }} />
        <div className="flex-1 space-y-6">
          <div>
            <SectionLabel>{section.section_key.replace(/_/g, " ")}</SectionLabel>
            <h2 className="slide-title text-[28px] mt-2" style={{ color: primary }}>{section.title}</h2>
          </div>
          <EditorialDivider />

          {c.text && <p className="slide-body text-gray-500 whitespace-pre-wrap max-w-xl">{c.text}</p>}

          {c.branch_photo_url && <img src={c.branch_photo_url} alt="" className="max-h-48 object-cover w-full" />}

          {c.actions && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-2">
              {c.actions.map((a: any, i: number) => (
                <div key={i}>
                  <div className="flex items-baseline gap-3">
                    <span className="slide-metric text-[20px]" style={{ color: gold }}>{String(i + 1).padStart(2, "0")}</span>
                    <h4 className="font-medium text-[14px]" style={{ color: primary }}>{a.title}</h4>
                  </div>
                  {a.description && <p className="text-[12px] text-gray-400 mt-1 ml-10 leading-relaxed">{a.description}</p>}
                </div>
              ))}
            </div>
          )}

          {c.items && (
            <div className="space-y-4 mt-2">
              {c.items.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
                  <span className="slide-metric text-[20px] shrink-0" style={{ color: gold }}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h4 className="font-medium text-[14px]" style={{ color: primary }}>{item.title || item.author_name}</h4>
                    <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">{item.description || item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {c.scenarios && (
            <div className="flex mt-4">
              {c.scenarios.map((s: any, i: number) => {
                const colors = ["#dc2626", primary, "#16a34a"];
                return (
                  <div key={i} className="flex-1 text-center py-6 relative">
                    {i > 0 && <div className="absolute left-0 top-4 bottom-4 w-px bg-gray-100" />}
                    <p className="slide-label text-gray-400 mb-2">{s.label}</p>
                    <p className="slide-metric text-[28px]" style={{ color: colors[i] }}>
                      {s.value ? `R$ ${Number(s.value).toLocaleString("pt-BR")}` : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {!c.text && !c.actions && !c.items && !c.scenarios && (
            <p className="text-gray-300 italic text-[14px]">{c.message || "Conteúdo pendente"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

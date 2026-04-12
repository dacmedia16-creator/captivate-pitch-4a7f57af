import { SectionData } from "./SectionRenderer";
import { MarketPriceBarChart, MarketStats } from "@/components/charts/MarketCharts";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

const FONT = "'Gotham', 'Montserrat', sans-serif";
const BLUE = "#003DA5";
const DEEP = "#001F5C";
const RED = "#DC1431";
const NEUTRAL = "#F5F6F8";

export function LayoutPremium({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || BLUE;
  const accent = branding?.secondary_color || RED;
  const deep = DEEP;

  const SectionLabel = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
    <p className="slide-label" style={{ color: light ? "rgba(255,255,255,0.45)" : accent }}>{children}</p>
  );

  /* ═══════ COVER ═══════ */
  if (section.section_key === "cover") {
    return (
      <div className="relative min-h-[500px] overflow-hidden text-white" style={{ fontFamily: FONT }}>
        {c.cover_image && <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${deep}ee 0%, ${primary}cc 50%, ${primary}88 100%)` }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 80%, ${accent}12 0%, transparent 50%)` }} />

        {c.logo_url && <img src={c.logo_url} alt="" className="absolute top-8 left-10 h-12 object-contain drop-shadow-lg" />}

        <div className="relative z-10 min-h-[500px] flex flex-col justify-end p-10 pb-14">
          <div className="flex items-end gap-6">
            <div className="w-[3px] h-24 rounded-full" style={{ background: `linear-gradient(to bottom, ${accent}, ${accent}33)` }} />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-12" style={{ backgroundColor: accent }} />
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
              </div>
              <h1 className="slide-title text-[52px] text-white max-w-lg">{c.title}</h1>
              <p className="slide-label text-white/40">{[c.neighborhood, c.city].filter(Boolean).join(" — ")}</p>
              {c.broker_name && <p className="text-[12px] text-white/25 font-light mt-2">{c.broker_name} · {c.agency_name}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ BROKER INTRO ═══════ */
  if (section.section_key === "broker_intro") {
    return (
      <div className="min-h-[500px] flex" style={{ fontFamily: FONT }}>
        <div className="flex-1 p-10 flex flex-col justify-center" style={{ background: `linear-gradient(160deg, ${deep} 0%, ${primary} 100%)` }}>
          <SectionLabel light>Seu consultor</SectionLabel>
          <h2 className="slide-title text-[42px] text-white mt-3 mb-2">{c.name}</h2>
          {c.creci && <p className="text-[11px] text-white/25 tracking-widest mb-6">CRECI {c.creci}</p>}
          <div className="w-12 h-[2px] rounded-full mb-6" style={{ backgroundColor: accent }} />
          {c.short_bio && <p className="slide-body text-white/50 max-w-sm">{c.short_bio}</p>}
          {c.education && <p className="text-[12px] text-white/35 mt-2">🎓 {c.education}</p>}
          {c.service_regions && <p className="text-[12px] text-white/35 mt-1">📍 {c.service_regions}</p>}
          {c.vgv_summary && <p className="text-[12px] text-white/25 italic mt-4">{c.vgv_summary}</p>}
          <div className="flex gap-6 mt-8">
            {c.years_in_market && (
              <div>
                <p className="slide-metric text-[28px] text-white">{c.years_in_market}</p>
                <p className="slide-label text-white/30 mt-1">Anos</p>
              </div>
            )}
            {c.specialties && (
              <div>
                <p className="text-[13px] font-semibold text-white">{c.specialties}</p>
                <p className="slide-label text-white/30 mt-1">Especialidades</p>
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
      <div className="min-h-[500px] bg-white" style={{ fontFamily: FONT }}>
        {c.images?.length > 0 && (
          <div className="flex gap-[1px]">
            <img src={c.images[0]} alt="" className="flex-[2] h-56 object-cover" />
            {c.images.length > 1 && (
              <div className="flex-1 flex flex-col gap-[1px]">
                {c.images.slice(1, 3).map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="flex-1 w-full object-cover" />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-10 space-y-5">
          <SectionLabel>O imóvel</SectionLabel>
          <h2 className="slide-title text-[32px]" style={{ color: primary }}>{section.title}</h2>
          <div className="h-[2px] w-full" style={{ backgroundColor: accent + "18" }} />
          <div className="flex gap-10 py-2">
            {[
              { label: "Área", value: c.area_total ? `${c.area_total}m²` : null },
              { label: "Quartos", value: c.bedrooms },
              { label: "Suítes", value: c.suites },
              { label: "Vagas", value: c.parking_spots },
            ].filter(i => i.value).map((item, i) => (
              <div key={i}>
                <p className="slide-metric text-[30px]" style={{ color: primary }}>{item.value}</p>
                <p className="slide-label mt-1" style={{ color: "#9CA3AF" }}>{item.label}</p>
              </div>
            ))}
          </div>
          {c.highlights && <p className="slide-body max-w-lg" style={{ color: "#6B7280" }}>{c.highlights}</p>}
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
        <div className="h-[2px] w-full mb-6" style={{ backgroundColor: accent + "18" }} />
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
        <SectionLabel>Precificação sugerida</SectionLabel>
        <h2 className="slide-title text-[28px] mt-2" style={{ color: primary }}>{section.title}</h2>
        {c.owner_expected_price && (
          <p className="text-[13px] mt-2 mb-6" style={{ color: "#9CA3AF" }}>
            Valor pretendido: <span className="font-bold" style={{ color: accent }}>R$ {Number(c.owner_expected_price).toLocaleString("pt-BR")}</span>
          </p>
        )}
        <div className="h-[2px] w-full mb-6" style={{ backgroundColor: accent + "18" }} />
        <div className="flex">
          {(c.scenarios || []).map((s: any, i: number) => {
            const colors = [accent, primary, "#16a34a"];
            return (
              <div key={i} className="flex-1 py-10 text-center relative">
                {i > 0 && <div className="absolute left-0 top-6 bottom-6 w-px" style={{ backgroundColor: accent + "22" }} />}
                <p className="slide-label mb-4" style={{ color: "#9CA3AF" }}>{s.label}</p>
                <p className="slide-metric text-[42px]" style={{ color: colors[i] }}>
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
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center text-white p-12 relative" style={{ background: `linear-gradient(135deg, ${deep}, ${primary}dd)`, fontFamily: FONT }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}08 0%, transparent 60%)` }} />
        {c.logo_url && <img src={c.logo_url} alt="" className="h-12 object-contain mb-10 opacity-70 relative z-10" />}
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="h-px w-20" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-px w-20" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
        </div>
        <h2 className="slide-title text-[38px] text-white mb-4 relative z-10">Obrigado pela confiança</h2>
        <p className="text-white/35 text-[14px] font-light max-w-sm mb-10 leading-relaxed relative z-10">Estou à disposição para transformar este imóvel em um excelente negócio.</p>
        <p className="text-[24px] font-bold relative z-10" style={{ color: accent }}>{c.broker_name}</p>
        <div className="space-y-1 text-[13px] text-white/40 mt-3 relative z-10">
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ GENERIC ═══════ */
  return (
    <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: FONT }}>
      <SectionLabel>{section.section_key.replace(/_/g, " ")}</SectionLabel>
      <h2 className="slide-title text-[28px] mt-2 mb-4" style={{ color: primary }}>{section.title}</h2>
      <div className="h-[2px] w-full mb-6" style={{ backgroundColor: accent + "18" }} />

      {c.text && <p className="slide-body whitespace-pre-wrap max-w-xl" style={{ color: "#6B7280" }}>{c.text}</p>}
      {c.branch_photo_url && (
        <img src={c.branch_photo_url} alt="" className="max-h-64 object-cover w-full rounded-lg mt-4" />
      )}

      {c.actions && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {c.actions.map((a: any, i: number) => (
            <div key={i} className="flex items-baseline gap-3">
              <span className="slide-metric text-[18px]" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h4 className="font-semibold text-[14px]" style={{ color: primary }}>{a.title}</h4>
                {a.description && <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#9CA3AF" }}>{a.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {c.items && (
        <div className="space-y-4">
          {c.items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
              <span className="slide-metric text-[18px] shrink-0" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
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
        <p className="italic text-[14px]" style={{ color: "#D1D5DB" }}>{c.message || "Conteúdo pendente"}</p>
      )}
    </div>
  );
}

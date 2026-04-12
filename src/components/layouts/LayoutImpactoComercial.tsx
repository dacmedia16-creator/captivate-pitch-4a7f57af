import { SectionData } from "./SectionRenderer";
import { MarketPriceBarChart, MarketStats } from "@/components/charts/MarketCharts";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

export function LayoutImpactoComercial({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || "#1e3a5f";
  const accent = branding?.secondary_color || "#10b981";

  const SectionLabel = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
    <p className="slide-label font-bold" style={{ color: light ? accent + "99" : accent }}>{children}</p>
  );

  /* ═══════ COVER ═══════ */
  if (section.section_key === "cover") {
    return (
      <div className="relative min-h-[500px] overflow-hidden flex flex-col justify-end text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        {c.cover_image && <img src={c.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 10%, ${primary}99 45%, ${primary} 100%)` }} />
        {c.logo_url && <img src={c.logo_url} alt="" className="absolute top-6 right-8 h-8 object-contain opacity-80" />}
        <div className="relative z-10 p-10 pb-12">
          <div className="w-12 h-1 rounded-full mb-5" style={{ backgroundColor: accent }} />
          <h1 className="slide-title text-[48px] text-white uppercase leading-[1.05] max-w-lg">{c.title}</h1>
          <p className="text-[14px] font-semibold tracking-widest uppercase mt-4" style={{ color: accent }}>{[c.neighborhood, c.city].filter(Boolean).join(" · ")}</p>
          {c.broker_name && <p className="text-[12px] text-white/40 mt-3">{c.broker_name} | {c.agency_name}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ BROKER INTRO ═══════ */
  if (section.section_key === "broker_intro") {
    return (
      <div className="min-h-[500px] bg-white flex" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex-1 p-10 flex flex-col justify-center">
          <SectionLabel>Seu consultor</SectionLabel>
          <h2 className="slide-title text-[36px] mt-3 uppercase" style={{ color: primary }}>{c.name}</h2>
          {c.creci && <p className="text-[11px] text-gray-400 tracking-wider mt-1 mb-6">CRECI {c.creci}</p>}
          <div className="w-8 h-1 rounded-full mb-5" style={{ backgroundColor: accent }} />
          {c.short_bio && <p className="slide-body text-gray-500 max-w-sm">{c.short_bio}</p>}
          <div className="flex gap-6 mt-8">
            {c.years_in_market && (
              <div className="px-5 py-3 text-white" style={{ backgroundColor: accent }}>
                <p className="slide-metric text-[24px]">{c.years_in_market}</p>
                <p className="text-[9px] uppercase tracking-widest opacity-80">Anos</p>
              </div>
            )}
            {c.specialties && (
              <div className="px-5 py-3 border-2" style={{ borderColor: accent, color: accent }}>
                <p className="text-[13px] font-bold">{c.specialties}</p>
                <p className="text-[9px] uppercase tracking-widest opacity-60">Especialidade</p>
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
      <div className="min-h-[500px] bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        {c.images?.length > 0 && <img src={c.images[0]} alt="" className="w-full h-56 object-cover" />}
        <div className="p-10 space-y-5">
          <SectionLabel>O imóvel</SectionLabel>
          <h2 className="slide-title text-[30px] uppercase" style={{ color: primary }}>{c.title || section.title}</h2>
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: accent }} />
          <div className="flex gap-8 py-2">
            {[
              { label: "m²", value: c.area_total },
              { label: "quartos", value: c.bedrooms },
              { label: "suítes", value: c.suites },
              { label: "vagas", value: c.parking_spots },
            ].filter(i => i.value).map((item, i) => (
              <div key={i}>
                <p className="slide-metric text-[32px]" style={{ color: primary }}>{item.value}</p>
                <p className="slide-label text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
          {c.highlights && (
            <p className="slide-body text-gray-500 border-l-4 pl-5" style={{ borderColor: accent }}>{c.highlights}</p>
          )}
        </div>
      </div>
    );
  }

  /* ═══════ DIFFERENTIALS ═══════ */
  if (section.section_key === "differentials") {
    return (
      <div className="min-h-[500px] text-white p-10" style={{ backgroundColor: primary, fontFamily: "'Inter', sans-serif" }}>
        <SectionLabel light>Por que nos escolher</SectionLabel>
        <h2 className="slide-title text-[28px] text-white uppercase mt-2 mb-8">{section.title || "Nossos diferenciais"}</h2>
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-white/10 last:border-0">
              <span className="slide-metric text-[24px] shrink-0" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h4 className="font-bold text-[14px]" style={{ color: accent }}>{item.title}</h4>
                {item.description && <p className="text-[12px] text-white/50 mt-1 leading-relaxed">{item.description}</p>}
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
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        <SectionLabel>Resultados comprovados</SectionLabel>
        <h2 className="slide-title text-[28px] uppercase mt-2 mb-8" style={{ color: primary }}>{section.title}</h2>
        <div className="flex gap-6 mb-8">
          {(c.items || []).slice(0, 3).map((item: any, i: number) => (
            <div key={i} className="flex-1 py-6 text-center" style={{ backgroundColor: accent + "0a" }}>
              {item.metric_value && <p className="slide-metric text-[36px]" style={{ color: accent }}>{item.metric_value}</p>}
              <p className="text-[12px] font-semibold mt-2 uppercase tracking-wider" style={{ color: primary }}>{item.title}</p>
            </div>
          ))}
        </div>
        {c.testimonials?.length > 0 && (
          <div className="space-y-4">
            {c.testimonials.slice(0, 2).map((t: any, i: number) => (
              <div key={i} className="py-5 border-t border-gray-100">
                <p className="slide-body text-gray-500 italic">"{t.content}"</p>
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
      <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        <SectionLabel>Análise de mercado</SectionLabel>
        <h2 className="slide-title text-[28px] uppercase mt-2 mb-6" style={{ color: primary }}>{section.title}</h2>
        <div className="w-8 h-1 rounded-full mb-6" style={{ backgroundColor: accent }} />
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
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center text-white p-12" style={{ backgroundColor: primary, fontFamily: "'Inter', sans-serif" }}>
        {c.logo_url && <img src={c.logo_url} alt="" className="h-12 object-contain mb-10 opacity-70" />}
        <h2 className="slide-title text-[36px] text-white uppercase mb-3">Vamos fechar negócio?</h2>
        <p className="text-white/40 text-[14px] font-light mb-8">Entre em contato agora mesmo.</p>
        <div className="px-10 py-4 text-[18px] font-bold tracking-wider" style={{ backgroundColor: accent }}>
          {c.broker_name}
        </div>
        <div className="space-y-1 text-[13px] text-white/40 mt-6">
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
      </div>
    );
  }

  /* ═══════ GENERIC ═══════ */
  return (
    <div className="min-h-[500px] bg-white p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SectionLabel>{section.section_key.replace(/_/g, " ")}</SectionLabel>
      <h2 className="slide-title text-[28px] uppercase mt-2 mb-4" style={{ color: primary }}>{section.title}</h2>
      <div className="w-8 h-1 rounded-full mb-6" style={{ backgroundColor: accent }} />

      {c.text && <p className="slide-body text-gray-500 whitespace-pre-wrap max-w-xl">{c.text}</p>}

      {c.actions && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {c.actions.map((a: any, i: number) => (
            <div key={i} className="py-3 border-b border-gray-100">
              <div className="flex items-baseline gap-3">
                <span className="slide-metric text-[20px]" style={{ color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                <h4 className="font-bold text-[14px] uppercase tracking-wider" style={{ color: primary }}>{a.title}</h4>
              </div>
              {a.description && <p className="text-[12px] text-gray-400 mt-1 ml-10 leading-relaxed">{a.description}</p>}
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
                <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">{item.description || item.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {c.scenarios && (
        <div className="flex mt-4">
          {c.scenarios.map((s: any, i: number) => {
            const colors = ["#dc2626", primary, accent];
            return (
              <div key={i} className="flex-1 text-center py-8 relative">
                {i > 0 && <div className="absolute left-0 top-4 bottom-4 w-px bg-gray-200" />}
                <p className="slide-label text-gray-400 mb-3">{s.label}</p>
                <p className="slide-metric text-[36px]" style={{ color: colors[i] }}>
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
  );
}

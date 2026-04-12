import { SectionData } from "./SectionRenderer";
import { MarketPriceBarChart, MarketStats } from "@/components/charts/MarketCharts";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

export function LayoutPremium({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || "#1e3a5f";
  const gold = branding?.secondary_color || "#c9a84c";

  const GoldDivider = () => (
    <div className="flex items-center gap-3 my-4">
      <div className="h-px flex-1" style={{ backgroundColor: gold + "33" }} />
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: gold }} />
      <div className="h-px flex-1" style={{ backgroundColor: gold + "33" }} />
    </div>
  );

  if (section.section_key === "cover") {
    return (
      <div className="relative min-h-[500px] rounded-xl overflow-hidden flex flex-col items-center justify-center text-center text-white" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 60%, ${gold}22 100%)` }}>
        {c.cover_image && <img src={c.cover_image} alt="Imóvel" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 50%, ${gold}15 0%, transparent 70%)` }} />
        <div className="relative z-10 space-y-6 p-8">
          {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-16 mx-auto object-contain drop-shadow-lg" />}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16" style={{ backgroundColor: gold }} />
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: gold }} />
            <div className="h-px w-16" style={{ backgroundColor: gold }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">{c.title}</h1>
          <p className="text-lg opacity-80 tracking-widest uppercase text-sm">{[c.neighborhood, c.city].filter(Boolean).join(" — ")}</p>
          {c.broker_name && <p className="text-sm opacity-50 mt-4">{c.broker_name} • {c.agency_name}</p>}
        </div>
      </div>
    );
  }

  if (section.section_key === "broker_intro") {
    return (
      <div className="min-h-[500px] rounded-xl p-8 md:p-12 text-white flex items-center" style={{ background: `linear-gradient(160deg, ${primary}ee 0%, ${primary} 100%)` }}>
        <div className="flex items-start gap-8 w-full">
          {c.avatar_url && <img src={c.avatar_url} alt={c.name} className="h-32 w-32 rounded-full object-cover border-4 shadow-xl" style={{ borderColor: gold }} />}
          <div className="space-y-3 flex-1">
            <h2 className="text-3xl font-bold font-serif tracking-tight">{c.name}</h2>
            {c.creci && <p className="text-sm opacity-60 tracking-wider">CRECI: {c.creci}</p>}
            <div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: gold }} />
            {c.short_bio && <p className="text-white/80 leading-relaxed">{c.short_bio}</p>}
            {c.vgv_summary && <p className="text-sm opacity-50 italic">{c.vgv_summary}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (section.section_key === "property_summary") {
    return (
      <div className="min-h-[500px] rounded-xl overflow-hidden" style={{ background: `linear-gradient(180deg, ${primary}06, white)` }}>
        {c.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-0.5">
            <img src={c.images[0]} alt="Principal" className="col-span-2 h-48 w-full object-cover" />
            {c.images.slice(1, 3).map((img: string, i: number) => (
              <img key={i} src={img} alt={`Foto ${i+2}`} className="h-32 w-full object-cover" />
            ))}
          </div>
        )}
        <div className="p-8 space-y-3">
          <h2 className="text-2xl font-bold font-serif tracking-tight" style={{ color: primary }}>{section.title}</h2>
          <GoldDivider />
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Área", value: c.area_total ? `${c.area_total}m²` : null },
              { label: "Quartos", value: c.bedrooms },
              { label: "Suítes", value: c.suites },
              { label: "Vagas", value: c.parking_spots },
            ].filter(i => i.value).map((item, i) => (
              <div key={i} className="text-center py-3 px-2 rounded-xl border" style={{ borderColor: gold + "22", backgroundColor: primary + "06" }}>
                <p className="text-2xl font-bold font-serif" style={{ color: primary }}>{item.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          {c.highlights && <p className="text-gray-600 leading-relaxed mt-2">{c.highlights}</p>}
        </div>
      </div>
    );
  }

  if (section.section_key === "closing") {
    return (
      <div className="min-h-[500px] rounded-xl flex flex-col items-center justify-center text-center text-white p-8" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}>
        {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-14 object-contain mb-6 drop-shadow-lg" />}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-12" style={{ backgroundColor: gold }} />
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: gold }} />
          <div className="h-px w-12" style={{ backgroundColor: gold }} />
        </div>
        <h2 className="text-3xl font-bold font-serif mb-4 tracking-tight">Obrigado pela confiança</h2>
        <p className="opacity-70 mb-6 max-w-md">Estou à disposição para transformar este imóvel em um excelente negócio.</p>
        <div className="space-y-1 text-sm opacity-70">
          <p className="font-semibold text-lg" style={{ color: gold }}>{c.broker_name}</p>
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
      </div>
    );
  }

  if (section.section_key === "market_study_placeholder" && c.comparables?.length > 0) {
    return (
      <div className="min-h-[500px] rounded-xl p-8 md:p-12 bg-white">
        <h2 className="text-2xl font-bold font-serif mb-1 tracking-tight" style={{ color: primary }}>{section.title}</h2>
        <GoldDivider />
        <MarketStats avgPrice={c.avg_price} medianPrice={c.median_price} avgPricePerSqm={c.avg_price_per_sqm} totalComparables={c.comparables.length} compact />
        <div className="mt-4">
          <MarketPriceBarChart comparables={c.comparables} ownerExpectedPrice={c.owner_expected_price} compact primaryColor={primary} accentColor={gold} />
        </div>
      </div>
    );
  }

  // Generic
  return (
    <div className="min-h-[500px] rounded-xl p-8 md:p-12 bg-white">
      <h2 className="text-2xl font-bold font-serif mb-1 tracking-tight" style={{ color: primary }}>{section.title}</h2>
      <GoldDivider />
      {c.text ? <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{c.text}</p> : null}
      {c.actions ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {c.actions.map((a: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border text-center" style={{ borderColor: gold + "33" }}>
              <h4 className="font-medium text-sm">{a.title}</h4>
              {a.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.description}</p>}
            </div>
          ))}
        </div>
      ) : null}
      {c.items ? (
        <div className="space-y-3 mt-4">
          {c.items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: gold }}>{i + 1}</div>
              <div>
                <h4 className="font-medium text-sm">{item.title || item.author_name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description || item.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {c.scenarios ? (
        <div className="grid grid-cols-3 gap-4 mt-4">
          {c.scenarios.map((s: any, i: number) => {
            const colors = ["#ef4444", primary, "#22c55e"];
            return (
              <div key={i} className="p-5 rounded-xl text-center border" style={{ borderColor: colors[i] + "22", backgroundColor: colors[i] + "06" }}>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold font-serif mt-1" style={{ color: colors[i] }}>{s.value ? `R$ ${Number(s.value).toLocaleString("pt-BR")}` : "—"}</p>
              </div>
            );
          })}
        </div>
      ) : null}
      {!c.text && !c.actions && !c.items && !c.scenarios && (
        <p className="text-gray-400 italic">{c.message || "Conteúdo pendente"}</p>
      )}
    </div>
  );
}

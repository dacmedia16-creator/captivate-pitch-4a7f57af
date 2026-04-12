import { SectionData } from "./SectionRenderer";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

export function LayoutImpactoComercial({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || "#1e3a5f";
  const accent = branding?.secondary_color || "#10b981";

  if (section.section_key === "cover") {
    return (
      <div className="relative min-h-[500px] rounded-xl overflow-hidden flex flex-col justify-end text-white">
        {c.cover_image && <img src={c.cover_image} alt="Imóvel" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 15%, ${primary}dd 55%, ${primary} 100%)` }} />
        <div className="relative z-10 p-8 space-y-3">
          {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-10 object-contain drop-shadow-lg" />}
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-none">{c.title}</h1>
          <p className="text-lg font-semibold tracking-wider" style={{ color: accent }}>{[c.neighborhood, c.city].filter(Boolean).join(" • ")}</p>
          {c.broker_name && <p className="text-sm opacity-60">{c.broker_name} | {c.agency_name}</p>}
        </div>
      </div>
    );
  }

  if (section.section_key === "broker_intro") {
    return (
      <div className="min-h-[500px] rounded-xl p-8 flex items-center gap-8 bg-white">
        <div className="flex-1 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Seu consultor</p>
          <h2 className="text-3xl font-extrabold leading-tight" style={{ color: primary }}>{c.name}</h2>
          {c.creci && <p className="text-sm text-gray-400">CRECI: {c.creci}</p>}
          {c.short_bio && <p className="text-gray-600 leading-relaxed">{c.short_bio}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {c.years_in_market && <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: accent }}>{c.years_in_market} anos</span>}
            {c.specialties && <span className="px-3 py-1.5 rounded-full text-xs font-bold border-2" style={{ borderColor: accent, color: accent }}>{c.specialties}</span>}
          </div>
        </div>
        {c.avatar_url && <img src={c.avatar_url} alt={c.name} className="h-40 w-40 rounded-2xl object-cover shadow-lg" />}
      </div>
    );
  }

  if (section.section_key === "property_summary") {
    return (
      <div className="min-h-[500px] rounded-xl overflow-hidden bg-white">
        {c.images?.length > 0 && <img src={c.images[0]} alt="Principal" className="w-full h-56 object-cover" />}
        <div className="p-8 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>O imóvel</p>
          <h2 className="text-2xl font-extrabold leading-tight" style={{ color: primary }}>{c.title || section.title}</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "m²", value: c.area_total },
              { label: "quartos", value: c.bedrooms },
              { label: "suítes", value: c.suites },
              { label: "vagas", value: c.parking_spots },
            ].filter(i => i.value).map((item, i) => (
              <div key={i} className="px-4 py-3 rounded-xl text-center border" style={{ borderColor: primary + "15", backgroundColor: primary + "06" }}>
                <p className="text-2xl font-extrabold" style={{ color: primary }}>{item.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
          {c.highlights && <p className="text-gray-600 border-l-4 pl-4 leading-relaxed" style={{ borderColor: accent }}>{c.highlights}</p>}
        </div>
      </div>
    );
  }

  if (section.section_key === "differentials") {
    return (
      <div className="min-h-[500px] rounded-xl p-8 text-white" style={{ backgroundColor: primary }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>Por que nos escolher</p>
        <h2 className="text-2xl font-extrabold mb-6">Nossos diferenciais</h2>
        <div className="grid grid-cols-2 gap-4">
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <h4 className="font-bold text-sm" style={{ color: accent }}>{item.title}</h4>
              {item.description && <p className="text-sm text-white/60 mt-1 leading-relaxed">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.section_key === "results") {
    return (
      <div className="min-h-[500px] rounded-xl p-8 bg-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>Resultados comprovados</p>
        <h2 className="text-2xl font-extrabold mb-6" style={{ color: primary }}>{section.title}</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="text-center p-4 rounded-xl border" style={{ borderColor: accent + "22", backgroundColor: accent + "08" }}>
              {item.metric_value && <p className="text-3xl font-extrabold" style={{ color: accent }}>{item.metric_value}</p>}
              <p className="font-medium text-sm mt-1" style={{ color: primary }}>{item.title}</p>
            </div>
          ))}
        </div>
        {c.testimonials?.length > 0 && (
          <div className="space-y-3">
            {c.testimonials.slice(0, 2).map((t: any, i: number) => (
              <div key={i} className="p-4 border rounded-xl border-gray-100">
                <p className="text-gray-600 italic leading-relaxed">"{t.content}"</p>
                <p className="text-sm font-semibold mt-2" style={{ color: primary }}>{t.author_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (section.section_key === "closing") {
    return (
      <div className="min-h-[500px] rounded-xl flex flex-col items-center justify-center text-center p-8 text-white" style={{ backgroundColor: primary }}>
        {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-14 object-contain mb-6 drop-shadow-lg" />}
        <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Vamos fechar negócio?</h2>
        <p className="opacity-60 mb-6">Entre em contato agora mesmo.</p>
        <div className="px-8 py-3 rounded-full text-lg font-bold shadow-lg" style={{ backgroundColor: accent, color: "white" }}>{c.broker_name}</div>
        <div className="space-y-1 text-sm opacity-60 mt-4">
          {c.broker_phone && <p>{c.broker_phone}</p>}
          {c.broker_email && <p>{c.broker_email}</p>}
        </div>
      </div>
    );
  }

  // Generic
  return (
    <div className="min-h-[500px] rounded-xl p-8 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>{section.section_key.replace(/_/g, " ")}</p>
      <h2 className="text-2xl font-extrabold mb-4" style={{ color: primary }}>{section.title}</h2>
      {c.text ? <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{c.text}</p> : null}
      {c.actions ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {c.actions.map((a: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border" style={{ borderColor: accent + "22", backgroundColor: accent + "06" }}>
              <h4 className="font-bold text-sm" style={{ color: primary }}>{a.title}</h4>
              {a.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.description}</p>}
            </div>
          ))}
        </div>
      ) : null}
      {c.scenarios ? (
        <div className="grid grid-cols-3 gap-4 mt-4">
          {c.scenarios.map((s: any, i: number) => {
            const colors = ["#ef4444", primary, accent];
            return (
              <div key={i} className="p-5 rounded-xl text-center border" style={{ borderColor: colors[i] + "22", backgroundColor: colors[i] + "08" }}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-extrabold mt-1" style={{ color: colors[i] }}>{s.value ? `R$ ${Number(s.value).toLocaleString("pt-BR")}` : "—"}</p>
              </div>
            );
          })}
        </div>
      ) : null}
      {!c.text && !c.actions && !c.scenarios && <p className="text-gray-400 italic">{c.message || "Conteúdo pendente"}</p>}
    </div>
  );
}

import { SectionData } from "./SectionRenderer";
import { Building, User, Globe, MapPin, Home, Target, Award, TrendingUp, BarChart3, DollarSign, Phone } from "lucide-react";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

export function LayoutExecutivo({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || "#1e3a5f";
  const gold = branding?.secondary_color || "#c9a84c";

  const sectionIcons: Record<string, any> = {
    cover: Building, broker_intro: User, about_global: Globe, about_national: Globe,
    about_regional: MapPin, property_summary: Home, marketing_plan: Target,
    differentials: Award, results: TrendingUp, market_study_placeholder: BarChart3,
    pricing_scenarios: DollarSign, closing: Phone,
  };
  const Icon = sectionIcons[section.section_key] || Building;

  const AccentLine = () => (
    <div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: gold }} />
  );

  return (
    <div className="bg-white text-gray-900 p-8 md:p-12 rounded-xl min-h-[500px] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {section.section_key === "cover" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-16 object-contain" />}
          {c.cover_image && <img src={c.cover_image} alt="Imóvel" className="w-full max-h-64 object-cover rounded-lg shadow-md" />}
          <AccentLine />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: primary }}>{c.title}</h1>
          <p className="text-lg text-gray-400 tracking-wide">{[c.neighborhood, c.city].filter(Boolean).join(" — ")}</p>
          {c.broker_name && <p className="text-sm text-gray-300">{c.broker_name} • {c.agency_name}</p>}
        </div>
      ) : section.section_key === "broker_intro" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-5 w-5" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <AccentLine />
          <div className="flex items-start gap-6 mt-4">
            {c.avatar_url && <img src={c.avatar_url} alt={c.name} className="h-24 w-24 rounded-full object-cover border-2 shadow-sm" style={{ borderColor: gold }} />}
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-semibold">{c.name}</h3>
              {c.creci && <p className="text-sm text-gray-500">CRECI: {c.creci}</p>}
              {c.short_bio && <p className="text-gray-600 leading-relaxed">{c.short_bio}</p>}
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 pt-2">
                {c.years_in_market && <span>📅 {c.years_in_market} anos de mercado</span>}
                {c.education && <span>🎓 {c.education}</span>}
                {c.specialties && <span>⭐ {c.specialties}</span>}
                {c.service_regions && <span>📍 {c.service_regions}</span>}
              </div>
            </div>
          </div>
        </div>
      ) : section.section_key === "property_summary" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-5 w-5" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <AccentLine />
          {c.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {c.images.slice(0, 3).map((img: string, i: number) => (
                <img key={i} src={img} alt={`Foto ${i+1}`} className="rounded-lg h-32 w-full object-cover shadow-sm" />
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "Tipo", value: c.property_type },
              { label: "Área total", value: c.area_total ? `${c.area_total} m²` : null },
              { label: "Área construída", value: c.area_built ? `${c.area_built} m²` : null },
              { label: "Dormitórios", value: c.bedrooms },
              { label: "Suítes", value: c.suites },
              { label: "Banheiros", value: c.bathrooms },
              { label: "Vagas", value: c.parking_spots },
              { label: "Padrão", value: c.property_standard },
            ].filter(i => i.value).map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100" style={{ backgroundColor: primary + "04" }}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="font-semibold text-sm mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
          {c.highlights && <p className="text-gray-600 mt-3 leading-relaxed">{c.highlights}</p>}
        </div>
      ) : section.section_key === "marketing_plan" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-5 w-5" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <AccentLine />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {(c.actions || []).map((a: any, i: number) => (
              <div key={i} className="p-4 rounded-lg border border-gray-100 space-y-1" style={{ backgroundColor: primary + "03" }}>
                <h4 className="font-medium text-sm">{a.title}</h4>
                {a.description && <p className="text-xs text-gray-500 leading-relaxed">{a.description}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : section.section_key === "differentials" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-5 w-5" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <AccentLine />
          <div className="space-y-3 mt-4">
            {(c.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: gold }}>{i + 1}</div>
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  {item.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : section.section_key === "pricing_scenarios" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-5 w-5" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <AccentLine />
          {c.owner_expected_price && (
            <p className="text-gray-600 text-sm mt-4">Valor pretendido pelo proprietário: <strong className="text-base">R$ {Number(c.owner_expected_price).toLocaleString("pt-BR")}</strong></p>
          )}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {(c.scenarios || []).map((s: any, i: number) => {
              const colors = ["#ef4444", primary, "#22c55e"];
              return (
                <div key={i} className="p-5 rounded-xl text-center border" style={{ borderColor: colors[i] + "33", backgroundColor: colors[i] + "06" }}>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: colors[i] }}>{s.value ? `R$ ${Number(s.value).toLocaleString("pt-BR")}` : "—"}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : section.section_key === "closing" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-12 object-contain" />}
          <AccentLine />
          <h2 className="text-2xl font-bold" style={{ color: primary }}>Obrigado!</h2>
          <p className="text-gray-500 max-w-sm">Vamos juntos encontrar o melhor resultado para o seu imóvel.</p>
          <div className="text-sm text-gray-500 space-y-1 mt-4">
            <p className="font-semibold text-base" style={{ color: primary }}>{c.broker_name}</p>
            {c.broker_phone && <p>{c.broker_phone}</p>}
            {c.broker_email && <p>{c.broker_email}</p>}
            <p className="text-xs text-gray-400">{c.agency_name}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="h-5 w-5" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <AccentLine />
          {c.text ? <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mt-4">{c.text}</p> : (
            <p className="text-gray-400 italic mt-4">{c.message || "Conteúdo pendente"}</p>
          )}
          {c.branch_photo_url && <img src={c.branch_photo_url} alt="Filial" className="rounded-lg max-h-48 object-cover w-full shadow-sm" />}
        </div>
      )}
    </div>
  );
}

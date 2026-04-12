import { SectionData } from "./SectionRenderer";
import { Building, User, Globe, MapPin, Home, Target, Award, TrendingUp, BarChart3, DollarSign, Phone } from "lucide-react";

interface Props {
  section: SectionData;
  branding?: { primary_color?: string | null; secondary_color?: string | null; logo_url?: string | null };
}

export function LayoutExecutivo({ section, branding }: Props) {
  const c = section.content || {};
  const primary = branding?.primary_color || "#1e3a5f";

  const sectionIcons: Record<string, any> = {
    cover: Building, broker_intro: User, about_global: Globe, about_national: Globe,
    about_regional: MapPin, property_summary: Home, marketing_plan: Target,
    differentials: Award, results: TrendingUp, market_study_placeholder: BarChart3,
    pricing_scenarios: DollarSign, closing: Phone,
  };
  const Icon = sectionIcons[section.section_key] || Building;

  return (
    <div className="bg-white text-gray-900 p-8 md:p-12 rounded-xl min-h-[500px] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {section.section_key === "cover" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-16 object-contain" />}
          {c.cover_image && <img src={c.cover_image} alt="Imóvel" className="w-full max-h-64 object-cover rounded-lg" />}
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: primary }}>{c.title}</h1>
          <p className="text-lg text-gray-500">{[c.neighborhood, c.city].filter(Boolean).join(" — ")}</p>
          {c.broker_name && <p className="text-sm text-gray-400">{c.broker_name} • {c.agency_name}</p>}
        </div>
      ) : section.section_key === "broker_intro" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Icon className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <div className="flex items-start gap-6">
            {c.avatar_url && <img src={c.avatar_url} alt={c.name} className="h-24 w-24 rounded-full object-cover border-2" style={{ borderColor: primary }} />}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{c.name}</h3>
              {c.creci && <p className="text-sm text-gray-500">CRECI: {c.creci}</p>}
              {c.short_bio && <p className="text-gray-600">{c.short_bio}</p>}
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
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          {c.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {c.images.slice(0, 3).map((img: string, i: number) => (
                <img key={i} src={img} alt={`Foto ${i+1}`} className="rounded-lg h-32 w-full object-cover" />
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          {c.highlights && <p className="text-gray-600 mt-3">{c.highlights}</p>}
        </div>
      ) : section.section_key === "marketing_plan" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(c.actions || []).map((a: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-1">
                <h4 className="font-medium text-sm">{a.title}</h4>
                {a.description && <p className="text-xs text-gray-500">{a.description}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : section.section_key === "differentials" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          <div className="space-y-3">
            {(c.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: primary }}>{i + 1}</div>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : section.section_key === "pricing_scenarios" ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          {c.owner_expected_price && (
            <p className="text-gray-600">Valor pretendido pelo proprietário: <strong>R$ {Number(c.owner_expected_price).toLocaleString("pt-BR")}</strong></p>
          )}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {(c.scenarios || []).map((s: any, i: number) => (
              <div key={i} className="p-4 rounded-lg text-center border" style={{ borderColor: primary + "33" }}>
                <p className="text-sm text-gray-500 mb-1">{s.label}</p>
                <p className="text-xl font-bold" style={{ color: primary }}>{s.value ? `R$ ${Number(s.value).toLocaleString("pt-BR")}` : "—"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : section.section_key === "closing" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          {c.logo_url && <img src={c.logo_url} alt="Logo" className="h-12 object-contain" />}
          <h2 className="text-2xl font-bold" style={{ color: primary }}>Obrigado!</h2>
          <p className="text-gray-600">Vamos juntos encontrar o melhor resultado para o seu imóvel.</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p className="font-medium">{c.broker_name}</p>
            {c.broker_phone && <p>{c.broker_phone}</p>}
            {c.broker_email && <p>{c.broker_email}</p>}
            <p className="text-xs">{c.agency_name}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-2xl font-bold" style={{ color: primary }}>{section.title}</h2>
          </div>
          {c.text ? <p className="text-gray-600 whitespace-pre-wrap">{c.text}</p> : (
            <p className="text-gray-400 italic">{c.message || "Conteúdo pendente"}</p>
          )}
          {c.branch_photo_url && <img src={c.branch_photo_url} alt="Filial" className="rounded-lg max-h-48 object-cover w-full" />}
        </div>
      )}
    </div>
  );
}

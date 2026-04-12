import { SectionData } from "@/components/layouts/SectionRenderer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface EditPanelProps {
  section: SectionData | null;
  onUpdate: (id: string, content: any, title: string | null) => void;
}

export function EditPanel({ section, onUpdate }: EditPanelProps) {
  if (!section) {
    return (
      <div className="w-80 border-l border-border bg-card flex items-center justify-center p-6">
        <p className="text-muted-foreground text-sm text-center">Selecione um slide para editar</p>
      </div>
    );
  }

  const content = section.content || {};

  const handleFieldChange = (field: string, value: any) => {
    const updated = { ...content, [field]: value };
    onUpdate(section.id, updated, section.title);
  };

  const renderFields = () => {
    switch (section.section_key) {
      case "cover":
        return (
          <>
            <Field label="Título" value={content.title} onChange={v => handleFieldChange("title", v)} />
            <Field label="Endereço" value={content.address} onChange={v => handleFieldChange("address", v)} />
            <Field label="Bairro" value={content.neighborhood} onChange={v => handleFieldChange("neighborhood", v)} />
            <Field label="Cidade" value={content.city} onChange={v => handleFieldChange("city", v)} />
          </>
        );
      case "broker_intro":
        return (
          <>
            <Field label="Nome" value={content.name} onChange={v => handleFieldChange("name", v)} />
            <Field label="CRECI" value={content.creci} onChange={v => handleFieldChange("creci", v)} />
            <TextAreaField label="Bio" value={content.short_bio} onChange={v => handleFieldChange("short_bio", v)} />
            <Field label="Especialidades" value={content.specialties} onChange={v => handleFieldChange("specialties", v)} />
          </>
        );
      case "about_global":
      case "about_national":
      case "about_regional":
        return <TextAreaField label="Conteúdo" value={content.text} onChange={v => handleFieldChange("text", v)} rows={8} />;
      case "property_summary":
        return (
          <>
            <Field label="Tipo" value={content.property_type} onChange={v => handleFieldChange("property_type", v)} />
            <TextAreaField label="Destaques" value={content.highlights} onChange={v => handleFieldChange("highlights", v)} />
          </>
        );
      case "pricing_scenarios":
        return (
          <>
            <Field label="Valor pretendido" value={content.owner_expected_price} onChange={v => handleFieldChange("owner_expected_price", v)} type="number" />
            {(content.scenarios || []).map((s: any, i: number) => (
              <Field key={i} label={s.label} value={s.value || ""} onChange={v => {
                const scenarios = [...(content.scenarios || [])];
                scenarios[i] = { ...scenarios[i], value: v };
                handleFieldChange("scenarios", scenarios);
              }} type="number" />
            ))}
          </>
        );
      case "closing":
        return (
          <>
            <Field label="Nome" value={content.broker_name} onChange={v => handleFieldChange("broker_name", v)} />
            <Field label="Telefone" value={content.broker_phone} onChange={v => handleFieldChange("broker_phone", v)} />
            <Field label="Email" value={content.broker_email} onChange={v => handleFieldChange("broker_email", v)} />
          </>
        );
      default:
        return (
          <>
            {content.text !== undefined && (
              <TextAreaField label="Conteúdo" value={content.text} onChange={v => handleFieldChange("text", v)} rows={6} />
            )}
            {content.message !== undefined && (
              <TextAreaField label="Mensagem" value={content.message} onChange={v => handleFieldChange("message", v)} />
            )}
          </>
        );
    }
  };

  return (
    <div className="w-80 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">{section.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{section.section_key}</p>
      </div>
      <div className="p-4 space-y-4">
        {renderFields()}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value || ""} onChange={e => onChange(e.target.value)} className="h-8 text-sm" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }: { label: string; value: any; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={rows} className="text-sm" />
    </div>
  );
}

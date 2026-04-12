import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

export interface PropertyData {
  title: string;
  owner_name: string;
  property_type: string;
  property_purpose: string;
  address: string;
  city: string;
  neighborhood: string;
  condominium: string;
  cep: string;
  area_total: string;
  area_built: string;
  area_land: string;
  bedrooms: string;
  suites: string;
  bathrooms: string;
  parking_spots: string;
  property_standard: string;
  property_age: string;
  highlights: string;
  owner_expected_price: string;
  notes: string;
  photos: string[];
}

interface StepPropertyDataProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}

export function StepPropertyData({ data, onChange }: StepPropertyDataProps) {
  const update = (field: keyof PropertyData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const addPhoto = (url: string | null) => {
    if (url) onChange({ ...data, photos: [...data.photos, url] });
  };

  const removePhoto = (index: number) => {
    onChange({ ...data, photos: data.photos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Identificação</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da apresentação</Label>
            <Input value={data.title} onChange={e => update("title", e.target.value)} placeholder="Ex: Apartamento Vila Mariana" />
          </div>
          <div className="space-y-2">
            <Label>Nome do proprietário</Label>
            <Input value={data.owner_name} onChange={e => update("owner_name", e.target.value)} placeholder="Nome do proprietário" />
          </div>
          <div className="space-y-2">
            <Label>Tipo do imóvel</Label>
            <Select value={data.property_type} onValueChange={v => update("property_type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Apartamento", "Casa", "Cobertura", "Terreno", "Sala Comercial", "Galpão", "Fazenda", "Outro"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Finalidade</Label>
            <Select value={data.property_purpose} onValueChange={v => update("property_purpose", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Venda", "Locação", "Venda e Locação"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Localização</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label>Endereço</Label>
            <Input value={data.address} onChange={e => update("address", e.target.value)} placeholder="Rua, número" />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={data.city} onChange={e => update("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input value={data.neighborhood} onChange={e => update("neighborhood", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Condomínio</Label>
            <Input value={data.condominium} onChange={e => update("condominium", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input value={data.cep} onChange={e => update("cep", e.target.value)} placeholder="00000-000" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Características</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Área total (m²)</Label>
            <Input type="number" value={data.area_total} onChange={e => update("area_total", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Área construída (m²)</Label>
            <Input type="number" value={data.area_built} onChange={e => update("area_built", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Área terreno (m²)</Label>
            <Input type="number" value={data.area_land} onChange={e => update("area_land", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dormitórios</Label>
            <Input type="number" value={data.bedrooms} onChange={e => update("bedrooms", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Suítes</Label>
            <Input type="number" value={data.suites} onChange={e => update("suites", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Banheiros</Label>
            <Input type="number" value={data.bathrooms} onChange={e => update("bathrooms", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Vagas</Label>
            <Input type="number" value={data.parking_spots} onChange={e => update("parking_spots", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Padrão</Label>
            <Select value={data.property_standard} onValueChange={v => update("property_standard", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Econômico", "Médio", "Alto", "Luxo"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Idade do imóvel</Label>
            <Select value={data.property_age} onValueChange={v => update("property_age", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Novo/Na planta", "Até 5 anos", "5-10 anos", "10-20 anos", "20-30 anos", "Mais de 30 anos"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Valor pretendido (R$)</Label>
            <Input type="number" value={data.owner_expected_price} onChange={e => update("owner_expected_price", e.target.value)} placeholder="0" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Detalhes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Diferenciais do imóvel</Label>
            <Textarea value={data.highlights} onChange={e => update("highlights", e.target.value)} placeholder="Piscina, churrasqueira, vista panorâmica..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={data.notes} onChange={e => update("notes", e.target.value)} placeholder="Observações gerais sobre o imóvel..." rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Fotos do imóvel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {data.photos.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`Foto ${i + 1}`} className="h-24 w-24 rounded-lg object-cover border border-border" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <ImageUploader value={null} onChange={addPhoto} folder="presentations" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

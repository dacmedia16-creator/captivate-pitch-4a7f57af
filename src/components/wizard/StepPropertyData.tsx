import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Tag, MapPin, Ruler, Star, Camera } from "lucide-react";

export interface PropertyData {
  title: string; owner_name: string; property_type: string; property_purpose: string;
  address: string; city: string; neighborhood: string; condominium: string; cep: string;
  area_total: string; area_built: string; area_land: string; bedrooms: string; suites: string;
  bathrooms: string; parking_spots: string; property_standard: string; property_age: string;
  highlights: string; owner_expected_price: string; notes: string; photos: string[];
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

  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, "");
    if (!num) return "";
    return Number(num).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Identificação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nome da apresentação</Label>
            <Input value={data.title} onChange={e => update("title", e.target.value)} placeholder="Ex: Apartamento Vila Mariana" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nome do proprietário</Label>
            <Input value={data.owner_name} onChange={e => update("owner_name", e.target.value)} placeholder="Nome do proprietário" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo do imóvel</Label>
            <Select value={data.property_type} onValueChange={v => update("property_type", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Apartamento", "Casa", "Cobertura", "Terreno", "Sala Comercial", "Galpão", "Fazenda", "Outro"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Finalidade</Label>
            <Select value={data.property_purpose} onValueChange={v => update("property_purpose", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Venda", "Locação", "Venda e Locação"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Localização</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Endereço</Label>
            <Input value={data.address} onChange={e => update("address", e.target.value)} placeholder="Rua, número" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cidade</Label>
            <Input value={data.city} onChange={e => update("city", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Bairro</Label>
            <Input value={data.neighborhood} onChange={e => update("neighborhood", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Condomínio</Label>
            <Input value={data.condominium} onChange={e => update("condominium", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">CEP</Label>
            <Input value={data.cep} onChange={e => update("cep", e.target.value)} placeholder="00000-000" className="h-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Características</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Área total (m²)</Label>
            <Input type="number" value={data.area_total} onChange={e => update("area_total", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Área construída (m²)</Label>
            <Input type="number" value={data.area_built} onChange={e => update("area_built", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Área terreno (m²)</Label>
            <Input type="number" value={data.area_land} onChange={e => update("area_land", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Dormitórios</Label>
            <Input type="number" value={data.bedrooms} onChange={e => update("bedrooms", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Suítes</Label>
            <Input type="number" value={data.suites} onChange={e => update("suites", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Banheiros</Label>
            <Input type="number" value={data.bathrooms} onChange={e => update("bathrooms", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vagas</Label>
            <Input type="number" value={data.parking_spots} onChange={e => update("parking_spots", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Padrão</Label>
            <Select value={data.property_standard} onValueChange={v => update("property_standard", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Econômico", "Médio", "Alto", "Luxo"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Idade do imóvel</Label>
            <Select value={data.property_age} onValueChange={v => update("property_age", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["Novo/Na planta", "Até 5 anos", "5-10 anos", "10-20 anos", "20-30 anos", "Mais de 30 anos"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor pretendido (R$)</Label>
            <Input
              value={data.owner_expected_price ? formatCurrency(data.owner_expected_price) : ""}
              onChange={e => update("owner_expected_price", e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Detalhes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Diferenciais do imóvel</Label>
            <Textarea value={data.highlights} onChange={e => update("highlights", e.target.value)} placeholder="Piscina, churrasqueira, vista panorâmica..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea value={data.notes} onChange={e => update("notes", e.target.value)} placeholder="Observações gerais sobre o imóvel..." rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Fotos do imóvel</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {data.photos.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`Foto ${i + 1}`} className="h-24 w-24 rounded-lg object-cover border border-border/50 shadow-sm" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center hover:border-accent/50 transition-colors">
              <ImageUploader value={null} onChange={addPhoto} folder="presentations" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

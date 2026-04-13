import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Tag, MapPin, Ruler, Star, Camera, Loader2, Home, DollarSign, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface PropertyData {
  title: string; owner_name: string; property_type: string; property_purpose: string;
  address: string; city: string; neighborhood: string; condominium: string; cep: string;
  state: string;
  area_total: string; area_built: string; area_land: string; area_useful: string;
  bedrooms: string; suites: string; bathrooms: string; parking_spots: string;
  living_rooms: string; powder_rooms: string;
  property_standard: string; property_age: string;
  construction_standard: string; conservation_state: string;
  differentials: string[];
  condominium_fee: string; iptu: string; pricing_objective: string;
  highlights: string; owner_expected_price: string; notes: string; photos: string[];
}

const DIFFERENTIALS = [
  "Piscina", "Área Gourmet", "Escritório", "Energia Solar", "Automação",
  "Planejados", "Vista Privilegiada", "Esquina", "Quintal Amplo", "Varanda",
  "Elevador", "Mobiliado", "Quadra", "Churrasqueira", "Sauna", "Academia",
  "Salão de Festas", "Playground", "Brinquedoteca", "Portaria 24h",
  "Jardim", "Lavabo", "Despensa", "Closet", "Aquecimento Central",
  "Ar Condicionado", "Lareira", "Depósito", "Coworking", "Pet Place",
  "Bicicletário", "Spa",
];

interface StepPropertyDataProps {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
}

export function StepPropertyData({ data, onChange }: StepPropertyDataProps) {
  const [cepLoading, setCepLoading] = useState(false);

  const update = (field: keyof PropertyData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleCepChange = useCallback(async (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    onChange({ ...data, cep: masked });

    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const json = await res.json();
        if (json.erro) {
          toast.error("CEP não encontrado");
        } else {
          onChange({
            ...data,
            cep: masked,
            address: json.logradouro || data.address,
            neighborhood: json.bairro || data.neighborhood,
            city: json.localidade || data.city,
            state: json.uf || data.state,
          });
        }
      } catch {
        toast.error("Erro ao buscar CEP");
      } finally {
        setCepLoading(false);
      }
    }
  }, [data, onChange]);

  const toggleDifferential = (d: string) => {
    const arr = data.differentials.includes(d)
      ? data.differentials.filter((x) => x !== d)
      : [...data.differentials, d];
    onChange({ ...data, differentials: arr });
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
      {/* Identificação */}
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

      {/* Localização */}
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
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Input value={data.state} onChange={e => update("state", e.target.value)} placeholder="SP" className="h-10" maxLength={2} />
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
            <div className="relative">
              <Input
                value={data.cep}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="h-10 pr-8"
              />
              {cepLoading && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Características */}
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
            <Label className="text-xs text-muted-foreground">Área útil (m²)</Label>
            <Input type="number" value={data.area_useful} onChange={e => update("area_useful", e.target.value)} className="h-10" />
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
            <Label className="text-xs text-muted-foreground">Salas</Label>
            <Input type="number" value={data.living_rooms} onChange={e => update("living_rooms", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Lavabos</Label>
            <Input type="number" value={data.powder_rooms} onChange={e => update("powder_rooms", e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Padrão construtivo</Label>
            <Select value={data.construction_standard} onValueChange={v => update("construction_standard", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {[
                  { value: "simples", label: "Simples" },
                  { value: "medio", label: "Médio" },
                  { value: "alto", label: "Alto Padrão" },
                  { value: "luxo", label: "Luxo" },
                ].map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Estado de conservação</Label>
            <Select value={data.conservation_state} onValueChange={v => update("conservation_state", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {[
                  { value: "ruim", label: "Ruim" },
                  { value: "regular", label: "Regular" },
                  { value: "bom", label: "Bom" },
                  { value: "excelente", label: "Excelente" },
                  { value: "reformado", label: "Reformado" },
                ].map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
        </CardContent>
      </Card>

      {/* Diferenciais */}
      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Diferenciais</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DIFFERENTIALS.map((d) => (
              <label key={d} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={data.differentials.includes(d)}
                  onCheckedChange={() => toggleDifferential(d)}
                />
                <span className="text-sm">{d}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Valores e Objetivo */}
      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Valores e Objetivo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor pretendido (R$)</Label>
            <Input
              value={data.owner_expected_price ? formatCurrency(data.owner_expected_price) : ""}
              onChange={e => update("owner_expected_price", e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor do condomínio (R$)</Label>
            <Input
              value={data.condominium_fee ? formatCurrency(data.condominium_fee) : ""}
              onChange={e => update("condominium_fee", e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">IPTU anual (R$)</Label>
            <Input
              value={data.iptu ? formatCurrency(data.iptu) : ""}
              onChange={e => update("iptu", e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Objetivo da precificação</Label>
            <Select value={data.pricing_objective} onValueChange={v => update("pricing_objective", v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {[
                  { value: "venda_rapida", label: "Venda Rápida" },
                  { value: "melhor_preco", label: "Melhor Preço Possível" },
                  { value: "captacao", label: "Captação" },
                  { value: "locacao", label: "Locação" },
                ].map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes */}
      <Card className="glass-card card-hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-sans font-semibold">Detalhes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Diferenciais do imóvel (texto livre)</Label>
            <Textarea value={data.highlights} onChange={e => update("highlights", e.target.value)} placeholder="Piscina, churrasqueira, vista panorâmica..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea value={data.notes} onChange={e => update("notes", e.target.value)} placeholder="Observações gerais sobre o imóvel..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Fotos */}
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface SubjectPropertyData {
  purpose: string;
  property_type: string;
  property_category: string;
  address: string;
  neighborhood: string;
  condominium: string;
  city: string;
  state: string;
  cep: string;
  area_land?: number;
  area_built?: number;
  area_useful?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parking_spots?: number;
  living_rooms?: number;
  powder_rooms?: number;
  property_age: string;
  construction_standard: string;
  conservation_state: string;
  differentials: string[];
  condominium_fee?: number;
  iptu?: number;
  observations: string;
  pricing_objective: string;
  owner_expected_price?: number;
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

interface Props {
  data: SubjectPropertyData;
  onChange: (data: SubjectPropertyData) => void;
}

export function SubjectPropertyForm({ data, onChange }: Props) {
  const set = (field: keyof SubjectPropertyData, value: any) =>
    onChange({ ...data, [field]: value });

  const toggleDiff = (d: string) => {
    const arr = data.differentials.includes(d)
      ? data.differentials.filter((x) => x !== d)
      : [...data.differentials, d];
    set("differentials", arr);
  };

  const num = (field: keyof SubjectPropertyData) => ({
    type: "number" as const,
    value: data[field] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(field, e.target.value ? Number(e.target.value) : undefined),
  });

  return (
    <div className="space-y-6">
      {/* Finalidade e Tipo */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Informações Gerais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Finalidade</Label>
            <Select value={data.purpose} onValueChange={(v) => set("purpose", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Imóvel</Label>
            <Select value={data.property_type} onValueChange={(v) => set("property_type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residencial">Residencial</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="rural">Rural</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={data.property_category} onValueChange={(v) => set("property_category", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartamento">Apartamento</SelectItem>
                <SelectItem value="casa">Casa</SelectItem>
                <SelectItem value="terreno">Terreno</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="cobertura">Cobertura</SelectItem>
                <SelectItem value="sobrado">Sobrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Localização</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Input value={data.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número" />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input value={data.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Condomínio</Label>
            <Input value={data.condominium} onChange={(e) => set("condominium", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={data.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input value={data.state} onChange={(e) => set("state", e.target.value)} placeholder="SP" />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input value={data.cep} onChange={(e) => set("cep", e.target.value)} placeholder="00000-000" />
          </div>
        </CardContent>
      </Card>

      {/* Áreas */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Áreas (m²)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Área do Terreno</Label>
            <Input {...num("area_land")} />
          </div>
          <div className="space-y-2">
            <Label>Área Construída</Label>
            <Input {...num("area_built")} />
          </div>
          <div className="space-y-2">
            <Label>Área Útil</Label>
            <Input {...num("area_useful")} />
          </div>
        </CardContent>
      </Card>

      {/* Cômodos */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Cômodos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            ["bedrooms", "Dormitórios"],
            ["suites", "Suítes"],
            ["bathrooms", "Banheiros"],
            ["parking_spots", "Vagas"],
            ["living_rooms", "Salas"],
            ["powder_rooms", "Lavabos"],
          ] as const).map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Input {...num(field)} min={0} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Padrão e Conservação */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Características</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Idade Aproximada</Label>
            <Select value={data.property_age} onValueChange={(v) => set("property_age", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo / Na planta</SelectItem>
                <SelectItem value="ate_5">Até 5 anos</SelectItem>
                <SelectItem value="5_10">5 a 10 anos</SelectItem>
                <SelectItem value="10_20">10 a 20 anos</SelectItem>
                <SelectItem value="20_30">20 a 30 anos</SelectItem>
                <SelectItem value="mais_30">Mais de 30 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Padrão Construtivo</Label>
            <Select value={data.construction_standard} onValueChange={(v) => set("construction_standard", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto Padrão</SelectItem>
                <SelectItem value="luxo">Luxo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado de Conservação</Label>
            <Select value={data.conservation_state} onValueChange={(v) => set("conservation_state", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ruim">Ruim</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="bom">Bom</SelectItem>
                <SelectItem value="excelente">Excelente</SelectItem>
                <SelectItem value="reformado">Reformado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Diferenciais */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Diferenciais</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DIFFERENTIALS.map((d) => (
              <label key={d} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={data.differentials.includes(d)}
                  onCheckedChange={() => toggleDiff(d)}
                />
                <span className="text-sm">{d}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Valores e Objetivo */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Valores e Objetivo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Valor do Condomínio (R$)</Label>
            <Input {...num("condominium_fee")} />
          </div>
          <div className="space-y-2">
            <Label>IPTU Anual (R$)</Label>
            <Input {...num("iptu")} />
          </div>
          <div className="space-y-2">
            <Label>Preço Esperado pelo Proprietário (R$)</Label>
            <Input {...num("owner_expected_price")} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Objetivo da Precificação</Label>
            <Select value={data.pricing_objective} onValueChange={(v) => set("pricing_objective", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="venda_rapida">Venda Rápida</SelectItem>
                <SelectItem value="melhor_preco">Melhor Preço Possível</SelectItem>
                <SelectItem value="captacao">Captação</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Observações Adicionais</Label>
            <Textarea
              value={data.observations}
              onChange={(e) => set("observations", e.target.value)}
              placeholder="Informações extras sobre o imóvel..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

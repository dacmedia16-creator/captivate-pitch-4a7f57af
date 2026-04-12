import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export interface SearchConfigData {
  same_condominium: boolean;
  radius_km: number;
  area_range_pct: number;
  price_range_pct: number;
  max_comparables: number;
  min_similarity: number;
}

interface Props {
  data: SearchConfigData;
  onChange: (data: SearchConfigData) => void;
}

export function SearchConfigForm({ data, onChange }: Props) {
  const set = (field: keyof SearchConfigData, value: any) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Pesquisa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Priorizar mesmo condomínio</Label>
              <p className="text-xs text-muted-foreground">
                Buscar primeiro imóveis no mesmo condomínio
              </p>
            </div>
            <Switch
              checked={data.same_condominium}
              onCheckedChange={(v) => set("same_condominium", v)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Raio de busca</Label>
              <span className="text-sm text-muted-foreground font-medium">
                {data.radius_km} km
              </span>
            </div>
            <Slider
              value={[data.radius_km]}
              onValueChange={([v]) => set("radius_km", v)}
              min={1}
              max={30}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Faixa de metragem</Label>
              <span className="text-sm text-muted-foreground font-medium">
                ± {data.area_range_pct}%
              </span>
            </div>
            <Slider
              value={[data.area_range_pct]}
              onValueChange={([v]) => set("area_range_pct", v)}
              min={5}
              max={50}
              step={5}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Faixa de preço</Label>
              <span className="text-sm text-muted-foreground font-medium">
                ± {data.price_range_pct}%
              </span>
            </div>
            <Slider
              value={[data.price_range_pct]}
              onValueChange={([v]) => set("price_range_pct", v)}
              min={10}
              max={60}
              step={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Máx. comparáveis</Label>
              <Input
                type="number"
                value={data.max_comparables}
                onChange={(e) =>
                  set("max_comparables", Number(e.target.value) || 15)
                }
                min={5}
                max={50}
              />
            </div>
            <div className="space-y-2">
              <Label>Score mínimo de similaridade</Label>
              <Input
                type="number"
                value={data.min_similarity}
                onChange={(e) =>
                  set("min_similarity", Number(e.target.value) || 30)
                }
                min={0}
                max={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

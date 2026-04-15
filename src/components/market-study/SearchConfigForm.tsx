import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SearchConfigData {
  same_condominium: boolean;
  radius_km: number;
  area_range_pct: number;
  price_range_pct: number;
  max_comparables: number;
  min_similarity: number;
  selectedPortals: string[];
  max_listing_age_months: number;
}

interface Props {
  data: SearchConfigData;
  onChange: (data: SearchConfigData) => void;
}

export function SearchConfigForm({ data, onChange }: Props) {
  const { profile } = useAuth();
  const set = (field: keyof SearchConfigData, value: any) =>
    onChange({ ...data, [field]: value });

  const { data: portalList, isLoading: loadingPortals } = useQuery({
    queryKey: ["portals-market-study", profile?.tenant_id],
    queryFn: async () => {
      // Fetch all global portals
      const { data: sources } = await supabase
        .from("portal_sources")
        .select("*")
        .eq("is_global", true)
        .order("name");
      if (!sources) return [];

      // Fetch tenant settings if available
      let settingsMap = new Map<string, any>();
      if (profile?.tenant_id) {
        const { data: settings } = await supabase
          .from("tenant_portal_settings")
          .select("*")
          .eq("tenant_id", profile.tenant_id);
        settingsMap = new Map((settings || []).map((s) => [s.portal_source_id, s]));
      }

      return sources.map((src: any) => {
        const setting = settingsMap.get(src.id);
        return {
          id: src.id,
          portal_source_id: src.id,
          portal_name: src.name,
          base_url: src.base_url,
          is_enabled: setting ? setting.is_enabled : true, // global portals enabled by default
        };
      });
    },
    enabled: true,
  });

  const togglePortal = (portalId: string) => {
    const selected = data.selectedPortals.includes(portalId)
      ? data.selectedPortals.filter((id) => id !== portalId)
      : [...data.selectedPortals, portalId];
    set("selectedPortals", selected);
  };

  return (
    <div className="space-y-6">
      {/* Portais de pesquisa */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Portais de Pesquisa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingPortals ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))
          ) : portalList && portalList.length > 0 ? (
            portalList.map((portal: any) => (
              <div
                key={portal.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <span className="font-medium">
                  {portal.portal_name}
                </span>
                <Switch
                  checked={data.selectedPortals.includes(portal.portal_source_id)}
                  onCheckedChange={() => togglePortal(portal.portal_source_id)}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum portal disponível.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filtros de pesquisa */}
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

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Idade máxima do anúncio</Label>
              <span className="text-sm text-muted-foreground font-medium">
                {data.max_listing_age_months === 0 ? "Sem limite" : `${data.max_listing_age_months} meses`}
              </span>
            </div>
            <Select
              value={String(data.max_listing_age_months)}
              onValueChange={(v) => set("max_listing_age_months", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mês</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
                <SelectItem value="24">24 meses</SelectItem>
                <SelectItem value="0">Sem limite</SelectItem>
              </SelectContent>
            </Select>
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

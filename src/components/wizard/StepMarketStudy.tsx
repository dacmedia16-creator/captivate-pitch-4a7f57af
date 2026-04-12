import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export interface MarketStudyData {
  selectedPortals: string[];
  searchRadius: string;
  minArea: string;
  maxArea: string;
  minPrice: string;
  maxPrice: string;
  maxComparables: string;
}

interface StepMarketStudyProps {
  data: MarketStudyData;
  onChange: (data: MarketStudyData) => void;
}

export function StepMarketStudy({ data, onChange }: StepMarketStudyProps) {
  const { profile } = useAuth();

  const { data: portalSettings, isLoading } = useQuery({
    queryKey: ["tenant-portals-wizard", profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data: settings } = await supabase
        .from("tenant_portal_settings")
        .select("*, portal_sources(*)")
        .eq("tenant_id", profile.tenant_id)
        .eq("is_enabled", true)
        .order("priority");
      return settings || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const togglePortal = (portalId: string) => {
    const selected = data.selectedPortals.includes(portalId)
      ? data.selectedPortals.filter(id => id !== portalId)
      : [...data.selectedPortals, portalId];
    onChange({ ...data, selectedPortals: selected });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Portais de pesquisa</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)
          ) : portalSettings && portalSettings.length > 0 ? (
            portalSettings.map((ps: any) => (
              <div key={ps.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="font-medium">{ps.portal_sources?.name || "Portal"}</span>
                <Switch
                  checked={data.selectedPortals.includes(ps.portal_source_id)}
                  onCheckedChange={() => togglePortal(ps.portal_source_id)}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum portal configurado pela imobiliária.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Filtros de pesquisa</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Raio de busca</Label>
            <Select value={data.searchRadius} onValueChange={v => onChange({ ...data, searchRadius: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["500m", "1km", "2km", "5km", "10km"].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nº de comparáveis</Label>
            <Select value={data.maxComparables} onValueChange={v => onChange({ ...data, maxComparables: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["5", "10", "15", "20", "30"].map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Metragem mínima (m²)</Label>
            <Input type="number" value={data.minArea} onChange={e => onChange({ ...data, minArea: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Metragem máxima (m²)</Label>
            <Input type="number" value={data.maxArea} onChange={e => onChange({ ...data, maxArea: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Preço mínimo (R$)</Label>
            <Input type="number" value={data.minPrice} onChange={e => onChange({ ...data, minPrice: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Preço máximo (R$)</Label>
            <Input type="number" value={data.maxPrice} onChange={e => onChange({ ...data, maxPrice: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

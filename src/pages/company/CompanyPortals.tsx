import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { toast } from "sonner";

interface PortalSetting {
  id?: string;
  portal_source_id: string;
  portal_name: string;
  portal_code: string;
  is_enabled: boolean;
  priority: number;
  weight: number;
}

export default function CompanyPortals() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const qc = useQueryClient();

  const { data: portals = [], isLoading } = useQuery({
    queryKey: ["portal-settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data: sources } = await supabase.from("portal_sources").select("*").order("name");
      const { data: settings } = await supabase.from("tenant_portal_settings").select("*").eq("tenant_id", tenantId!);
      if (!sources) return [];

      const settingsMap = new Map((settings || []).map((s) => [s.portal_source_id, s]));
      return sources.map((src): PortalSetting => {
        const s = settingsMap.get(src.id);
        return {
          id: s?.id,
          portal_source_id: src.id,
          portal_name: src.name,
          portal_code: src.code,
          is_enabled: s?.is_enabled ?? false,
          priority: s?.priority ?? 1,
          weight: Number(s?.weight ?? 1),
        };
      });
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (portal: PortalSetting) => {
      if (portal.id) {
        const { error } = await supabase.from("tenant_portal_settings").update({
          is_enabled: portal.is_enabled,
          priority: portal.priority,
          weight: portal.weight,
        }).eq("id", portal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tenant_portal_settings").insert({
          tenant_id: tenantId!,
          portal_source_id: portal.portal_source_id,
          is_enabled: portal.is_enabled,
          priority: portal.priority,
          weight: portal.weight,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal-settings"] });
      toast.success("Portal atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleToggle = (portal: PortalSetting) => {
    upsertMutation.mutate({ ...portal, is_enabled: !portal.is_enabled });
  };

  const handleChange = (portal: PortalSetting, field: "priority" | "weight", value: string) => {
    upsertMutation.mutate({ ...portal, [field]: Number(value) || 1 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuração de Portais</h1>
        <p className="text-muted-foreground mt-1">Ative e configure os portais de pesquisa de mercado</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portals.map((portal) => (
            <Card key={portal.portal_source_id} className={`transition-opacity ${!portal.is_enabled ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{portal.portal_name}</p>
                      <p className="text-xs text-muted-foreground">{portal.portal_code}</p>
                    </div>
                  </div>
                  <Switch checked={portal.is_enabled} onCheckedChange={() => handleToggle(portal)} />
                </div>
                {portal.is_enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Prioridade</Label>
                      <Input
                        type="number"
                        min={1}
                        value={portal.priority}
                        onChange={(e) => handleChange(portal, "priority", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Peso</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={portal.weight}
                        onChange={(e) => handleChange(portal, "weight", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

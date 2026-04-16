import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Eye, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const statusMap: Record<string, string> = {
  draft: "Rascunho",
  processing: "Processando",
  completed: "Concluído",
  failed: "Erro",
};
const statusVariant: Record<string, "secondary" | "default" | "destructive"> = {
  draft: "secondary",
  processing: "default",
  completed: "default",
  failed: "destructive",
};

export default function MarketStudies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { data: studies, isLoading } = useQuery({
    queryKey: ["market-studies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_studies")
        .select("*, market_study_subject_properties(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleRetry = async (studyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingId(studyId);
    try {
      const { data: subjectData } = await supabase
        .from("market_study_subject_properties")
        .select("*")
        .eq("market_study_id", studyId)
        .limit(1);
      const subjectProp = subjectData?.[0];
      if (!subjectProp) throw new Error("Imóvel avaliado não encontrado");

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Não autenticado");
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", authUser.id).single();
      const tenantId = profile?.tenant_id;

      const { data: portalSettings } = await supabase
        .from("tenant_portal_settings")
        .select("*, portal_sources(*)")
        .eq("tenant_id", tenantId!)
        .eq("is_enabled", true);

      const portals = (portalSettings ?? []).map((ps: any) => ({
        id: ps.portal_sources.id,
        name: ps.portal_sources.name,
        code: ps.portal_sources.code,
      }));

      if (portals.length === 0) {
        const { data: globalPortals } = await supabase.from("portal_sources").select("*").eq("is_global", true);
        portals.push(...(globalPortals ?? []).map((p: any) => ({ id: p.id, name: p.name, code: p.code })));
      }

      await supabase.from("market_studies").update({
        status: "processing",
        current_phase: "collecting_urls",
        updated_at: new Date().toISOString(),
      } as any).eq("id", studyId);

      const propertyData = {
        property_type: subjectProp.property_type || subjectProp.property_category,
        neighborhood: subjectProp.neighborhood,
        city: subjectProp.city,
        condominium: subjectProp.condominium,
        bedrooms: subjectProp.bedrooms?.toString(),
        suites: subjectProp.suites?.toString(),
        area_total: (subjectProp.area_useful || subjectProp.area_built)?.toString(),
        area_built: subjectProp.area_built?.toString(),
        area_land: subjectProp.area_land?.toString(),
        owner_expected_price: subjectProp.owner_expected_price?.toString(),
        property_standard: subjectProp.construction_standard,
        property_purpose: subjectProp.purpose,
        state: subjectProp.state,
        parking_spots: subjectProp.parking_spots?.toString(),
      };

      const { error } = await supabase.functions.invoke("analyze-market-deep", {
        body: {
          property: propertyData,
          portals,
          filters: {},
          market_study_id: studyId,
          tenant_id: tenantId,
        },
      });

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["market-studies", user?.id] });
      toast.success("Estudo reiniciado! Acompanhe o progresso na página do estudo.");
    } catch (err: any) {
      toast.error("Erro ao reiniciar: " + (err.message || "erro"));
      await supabase.from("market_studies").update({ status: "failed", current_phase: null } as any).eq("id", studyId);
      queryClient.invalidateQueries({ queryKey: ["market-studies", user?.id] });
    } finally {
      setRetryingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Estudos de Mercado</h1>
        <p className="text-muted-foreground">
          Estudos gerados automaticamente ao criar apresentações
        </p>
      </div>

      {!studies || studies.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum estudo de mercado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie uma apresentação para gerar um estudo de mercado automaticamente
            </p>
            <Button
              onClick={() => navigate("/presentations/new")}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Apresentação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {studies.map((study: any) => {
            const subject = study.market_study_subject_properties?.[0];
            const isRetrying = retryingId === study.id;
            return (
              <Card
                key={study.id}
                className="glass-card hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/market-studies/${study.id}`)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">
                      {study.title || "Estudo sem título"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[subject?.neighborhood, subject?.city]
                        .filter(Boolean)
                        .join(", ") || "Endereço não informado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(study.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[study.status] ?? "secondary"}>
                      {statusMap[study.status] || study.status}
                    </Badge>
                    {study.status === "failed" && (
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={isRetrying}
                        onClick={(e) => handleRetry(study.id, e)}
                        title="Tentar novamente"
                      >
                        {isRetrying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Eye, Loader2, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

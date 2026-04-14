/** @deprecated Legacy page — uses market_analysis_jobs. Routes redirect to /market-studies. Will be removed. */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AgentMarketStudy() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["market-jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_analysis_jobs")
        .select("*, presentations(title, address, neighborhood, city)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statusMap: Record<string, string> = { pending: "Pendente", processing: "Processando", completed: "Concluído", failed: "Erro" };
  const statusColor: Record<string, string> = { pending: "secondary", processing: "default", completed: "default", failed: "destructive" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Estudos de Mercado</h1>
          <p className="text-muted-foreground">Análises comparativas para embasar suas captações</p>
        </div>
      </div>

      {(!jobs || jobs.length === 0) ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum estudo de mercado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Crie uma apresentação para gerar um estudo de mercado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job: any) => (
            <Card key={job.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/market-study/${job.id}`)}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{(job.presentations as any)?.title || "Sem título"}</p>
                  <p className="text-sm text-muted-foreground">
                    {[(job.presentations as any)?.neighborhood, (job.presentations as any)?.city].filter(Boolean).join(", ") || "Endereço não informado"}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusColor[job.status] as any}>{statusMap[job.status] || job.status}</Badge>
                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

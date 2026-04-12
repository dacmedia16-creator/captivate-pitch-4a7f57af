import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PlusCircle, Presentation, FileDown, BarChart3, BookTemplate, Loader2 } from "lucide-react";

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["agent-stats", uid],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [total, monthly, exports, studies, templates] = await Promise.all([
        supabase.from("presentations").select("id", { count: "exact", head: true }).eq("broker_id", uid!),
        supabase.from("presentations").select("id", { count: "exact", head: true }).eq("broker_id", uid!).gte("created_at", monthStart),
        supabase.from("export_history").select("id", { count: "exact", head: true }).eq("created_by", uid!),
        supabase.from("market_analysis_jobs").select("id", { count: "exact", head: true }),
        supabase.from("presentation_templates").select("id", { count: "exact", head: true }),
      ]);

      return {
        total: total.count || 0,
        monthly: monthly.count || 0,
        exports: exports.count || 0,
        studies: studies.count || 0,
        templates: templates.count || 0,
      };
    },
    enabled: !!uid,
  });

  const { data: recentPresentations } = useQuery({
    queryKey: ["agent-recent", uid],
    queryFn: async () => {
      const { data } = await supabase.from("presentations").select("id, title, status, created_at, neighborhood, city").eq("broker_id", uid!).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!uid,
  });

  const { data: drafts } = useQuery({
    queryKey: ["agent-drafts", uid],
    queryFn: async () => {
      const { data } = await supabase.from("presentations").select("id, title, created_at").eq("broker_id", uid!).eq("status", "draft").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!uid,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Painel</h1>
          <p className="text-muted-foreground">Gerencie suas apresentações e acompanhe seus resultados.</p>
        </div>
        <Button onClick={() => navigate("/presentations/new")} className="gold-gradient text-primary-foreground">
          <PlusCircle className="h-4 w-4 mr-2" /> Nova Apresentação
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard title="Total" value={stats?.total ?? 0} icon={Presentation} />
        <MetricCard title="Este mês" value={stats?.monthly ?? 0} icon={Presentation} />
        <MetricCard title="PDFs gerados" value={stats?.exports ?? 0} icon={FileDown} />
        <MetricCard title="Estudos" value={stats?.studies ?? 0} icon={BarChart3} />
        <MetricCard title="Modelos" value={stats?.templates ?? 0} icon={BookTemplate} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg">Apresentações recentes</CardTitle></CardHeader>
          <CardContent>
            {recentPresentations?.length ? (
              <div className="space-y-3">
                {recentPresentations.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/presentations/${p.id}/edit`)}>
                    <div>
                      <p className="font-medium text-sm">{p.title || "Sem título"}</p>
                      <p className="text-xs text-muted-foreground">{[p.neighborhood, p.city].filter(Boolean).join(", ")}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma apresentação ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg">Rascunhos</CardTitle></CardHeader>
          <CardContent>
            {drafts?.length ? (
              <div className="space-y-3">
                {drafts.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/presentations/${d.id}/edit`)}>
                    <p className="font-medium text-sm">{d.title || "Sem título"}</p>
                    <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum rascunho.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

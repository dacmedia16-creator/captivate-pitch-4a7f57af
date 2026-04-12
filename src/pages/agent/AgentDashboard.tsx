import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PlusCircle, Presentation, FileDown, BarChart3, BookTemplate, ArrowRight } from "lucide-react";
import { AgentDashboardSkeleton } from "@/components/skeletons/AgentDashboardSkeleton";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AgentDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const uid = user?.id;

  const tenantId = profile?.tenant_id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["agent-stats", uid, tenantId],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [total, monthly, exports, studies, templates] = await Promise.all([
        supabase.from("presentations").select("id", { count: "exact", head: true }).eq("broker_id", uid!),
        supabase.from("presentations").select("id", { count: "exact", head: true }).eq("broker_id", uid!).gte("created_at", monthStart),
        supabase.from("export_history").select("id", { count: "exact", head: true }).eq("created_by", uid!),
        supabase.from("market_analysis_jobs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
        supabase.from("presentation_templates").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
      ]);
      return { total: total.count || 0, monthly: monthly.count || 0, exports: exports.count || 0, studies: studies.count || 0, templates: templates.count || 0 };
    },
    enabled: !!uid && !!tenantId,
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
    return <AgentDashboardSkeleton />;
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Corretor";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}, {firstName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gerencie suas apresentações e acompanhe seus resultados.</p>
        </div>
        <Button onClick={() => navigate("/presentations/new")} className="gold-gradient text-primary-foreground shadow-md hover:shadow-lg transition-shadow">
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-sans font-semibold">Apresentações recentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/presentations")}>
                Ver todas <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentPresentations?.length ? (
              <div className="space-y-1">
                {recentPresentations.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 cursor-pointer transition-all group" onClick={() => navigate(`/presentations/${p.id}/edit`)}>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-accent/60 group-hover:bg-accent transition-colors" />
                      <div>
                        <p className="font-medium text-sm">{p.title || "Sem título"}</p>
                        <p className="text-[11px] text-muted-foreground">{[p.neighborhood, p.city].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma apresentação ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-sans font-semibold">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {drafts?.length ? (
              <div className="space-y-1">
                {drafts.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 cursor-pointer transition-all" onClick={() => navigate(`/presentations/${d.id}/edit`)}>
                    <p className="font-medium text-sm">{d.title || "Sem título"}</p>
                    <span className="text-[11px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum rascunho.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

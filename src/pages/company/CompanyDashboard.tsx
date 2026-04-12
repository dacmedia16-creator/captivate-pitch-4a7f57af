import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MetricCard } from "@/components/shared/MetricCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Presentation, BarChart3, FileText } from "lucide-react";
import { format } from "date-fns";

export default function CompanyDashboard() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const { data: brokerCount = 0 } = useQuery({
    queryKey: ["company-brokers", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!).eq("status", "active");
      return count || 0;
    },
  });

  const { data: presCount = 0 } = useQuery({
    queryKey: ["company-presentations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { count } = await supabase.from("presentations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!);
      return count || 0;
    },
  });

  const { data: studyCount = 0 } = useQuery({
    queryKey: ["company-studies", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { count } = await supabase.from("market_analysis_jobs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!);
      return count || 0;
    },
  });

  const { data: exportCount = 0 } = useQuery({
    queryKey: ["company-exports", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { count } = await supabase.from("export_history").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: recentPresentations = [], isLoading: loadingPres } = useQuery({
    queryKey: ["company-recent-pres", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("presentations").select("id, title, status, created_at, broker_id").eq("tenant_id", tenantId!).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const { data: recentBrokers = [], isLoading: loadingBrokers } = useQuery({
    queryKey: ["company-recent-brokers", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url, status, created_at").eq("tenant_id", tenantId!).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const presColumns: Column<any>[] = [
    { key: "title", header: "Título", render: (r) => <span className="font-medium">{r.title || "Sem título"}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "created", header: "Data", render: (r) => <span className="text-sm text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</span> },
  ];

  const brokerColumns: Column<any>[] = [
    {
      key: "name", header: "Corretor", render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={r.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{(r.full_name || "U")[0]}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{r.full_name || "Sem nome"}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (r) => <span className="text-sm text-muted-foreground">{r.email}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard da Imobiliária</h1>
        <p className="text-muted-foreground mt-1">Acompanhe o desempenho da sua equipe</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Corretores Ativos" value={brokerCount} icon={Users} />
        <MetricCard title="Apresentações" value={presCount} icon={Presentation} />
        <MetricCard title="Estudos de Mercado" value={studyCount} icon={BarChart3} />
        <MetricCard title="PDFs Exportados" value={exportCount} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3 font-sans">Últimas Apresentações</h2>
          <DataTable columns={presColumns} data={recentPresentations} loading={loadingPres} emptyMessage="Nenhuma apresentação ainda." />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3 font-sans">Corretores Recentes</h2>
          <DataTable columns={brokerColumns} data={recentBrokers} loading={loadingBrokers} emptyMessage="Nenhum corretor cadastrado." />
        </div>
      </div>
    </div>
  );
}

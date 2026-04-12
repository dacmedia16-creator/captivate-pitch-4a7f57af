import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/shared/MetricCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Building2, Users, UserCircle, Presentation, BarChart3, FileText } from "lucide-react";
import { format } from "date-fns";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  broker_count: number;
  presentation_count: number;
}

export default function AdminDashboard() {
  const { data: tenantCount = 0 } = useQuery({
    queryKey: ["admin-count-tenants"],
    queryFn: async () => {
      const { count } = await supabase.from("tenants").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: userCount = 0 } = useQuery({
    queryKey: ["admin-count-users"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: brokerCount = 0 } = useQuery({
    queryKey: ["admin-count-brokers"],
    queryFn: async () => {
      const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "broker");
      return count || 0;
    },
  });

  const { data: presentationCount = 0 } = useQuery({
    queryKey: ["admin-count-presentations"],
    queryFn: async () => {
      const { count } = await supabase.from("presentations").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: studyCount = 0 } = useQuery({
    queryKey: ["admin-count-studies"],
    queryFn: async () => {
      const { count } = await supabase.from("market_analysis_jobs").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: exportCount = 0 } = useQuery({
    queryKey: ["admin-count-exports"],
    queryFn: async () => {
      const { count } = await supabase.from("export_history").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin-tenants-list"],
    queryFn: async () => {
      const { data: tenantsData } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
      if (!tenantsData) return [];

      const rows: TenantRow[] = await Promise.all(
        tenantsData.map(async (t) => {
          const { count: bc } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("tenant_id", t.id);
          const { count: pc } = await supabase.from("presentations").select("id", { count: "exact", head: true }).eq("tenant_id", t.id);
          return { ...t, broker_count: bc || 0, presentation_count: pc || 0 };
        })
      );
      return rows;
    },
  });

  const columns: Column<TenantRow>[] = [
    { key: "name", header: "Nome", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "slug", header: "Slug", render: (r) => <span className="text-muted-foreground text-sm">{r.slug}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "brokers", header: "Corretores", render: (r) => r.broker_count },
    { key: "presentations", header: "Apresentações", render: (r) => r.presentation_count },
    { key: "created", header: "Criado em", render: (r) => <span className="text-sm text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</span> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Painel Global</h1>
        <p className="text-muted-foreground mt-1">Visão geral de toda a plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Imobiliárias" value={tenantCount} icon={Building2} />
        <MetricCard title="Usuários" value={userCount} icon={Users} />
        <MetricCard title="Corretores" value={brokerCount} icon={UserCircle} />
        <MetricCard title="Apresentações" value={presentationCount} icon={Presentation} />
        <MetricCard title="Estudos de Mercado" value={studyCount} icon={BarChart3} />
        <MetricCard title="PDFs Exportados" value={exportCount} icon={FileText} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 font-sans">Imobiliárias</h2>
        <DataTable
          columns={columns}
          data={tenants}
          loading={isLoading}
          searchPlaceholder="Buscar imobiliária..."
          searchFilter={(row, q) => row.name.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q)}
        />
      </div>
    </div>
  );
}

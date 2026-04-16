import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/shared/MetricCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Building2, Users, UserCircle, Presentation, BarChart3, FileText, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TenantRow {
  id: string; name: string; slug: string; status: string; created_at: string;
  broker_count: number; presentation_count: number;
}

export default function AdminDashboard() {
  const [syncing, setSyncing] = useState(false);

  const { data: tenantCount = 0 } = useQuery({ queryKey: ["admin-count-tenants"], queryFn: async () => { const { count } = await supabase.from("tenants").select("id", { count: "exact", head: true }); return count || 0; } });
  const { data: userCount = 0 } = useQuery({ queryKey: ["admin-count-users"], queryFn: async () => { const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }); return count || 0; } });
  const { data: brokerCount = 0 } = useQuery({ queryKey: ["admin-count-brokers"], queryFn: async () => { const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "broker"); return count || 0; } });
  const { data: presentationCount = 0 } = useQuery({ queryKey: ["admin-count-presentations"], queryFn: async () => { const { count } = await supabase.from("presentations").select("id", { count: "exact", head: true }); return count || 0; } });
  const { data: studyCount = 0 } = useQuery({ queryKey: ["admin-count-studies"], queryFn: async () => { const { count } = await supabase.from("market_studies").select("id", { count: "exact", head: true }); return count || 0; } });
  const { data: exportCount = 0 } = useQuery({ queryKey: ["admin-count-exports"], queryFn: async () => { const { count } = await supabase.from("export_history").select("id", { count: "exact", head: true }); return count || 0; } });

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

  const handleBatchSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("batch-sync-market-slides", { method: "POST" });
      if (error) throw error;
      toast.success(`Sincronização concluída! ${data?.updated || 0} apresentação(ões) atualizada(s).`);
    } catch (err: any) {
      toast.error("Erro ao sincronizar: " + (err.message || "erro desconhecido"));
    } finally {
      setSyncing(false);
    }
  };

  const columns: Column<TenantRow>[] = [
    { key: "name", header: "Nome", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "slug", header: "Slug", render: (r) => <span className="text-muted-foreground">{r.slug}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "brokers", header: "Corretores", render: (r) => r.broker_count },
    { key: "presentations", header: "Apresentações", render: (r) => r.presentation_count },
    { key: "created", header: "Criado em", render: (r) => <span className="text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</span> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Global</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visão geral de toda a plataforma</p>
        </div>
        <Button variant="outline" onClick={handleBatchSync} disabled={syncing}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sincronizar slides de mercado
        </Button>
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
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold font-sans">Imobiliárias</h2>
          <div className="section-divider" />
        </div>
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

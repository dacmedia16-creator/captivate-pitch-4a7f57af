import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  status: string;
  tenant_name: string | null;
  role_label: string;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  agency_admin: "Admin",
  broker: "Corretor",
};

export default function AdminUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!profiles) return [];

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: tenants } = await supabase.from("tenants").select("id, name");

      const rolesMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
      const tenantsMap = new Map((tenants || []).map((t) => [t.id, t.name]));

      return profiles.map((p): UserRow => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
        status: p.status,
        tenant_name: p.tenant_id ? tenantsMap.get(p.tenant_id) || null : null,
        role_label: roleLabels[rolesMap.get(p.id) || "broker"] || "Corretor",
        created_at: p.created_at,
      }));
    },
  });

  const columns: Column<UserRow>[] = [
    {
      key: "name", header: "Usuário", render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={r.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{(r.full_name || "U")[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{r.full_name || "Sem nome"}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Papel", render: (r) => <Badge variant="secondary" className="text-xs">{r.role_label}</Badge> },
    { key: "tenant", header: "Imobiliária", render: (r) => <span className="text-sm">{r.tenant_name || "—"}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "created", header: "Cadastro", render: (r) => <span className="text-sm text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground mt-1">Todos os usuários do sistema</p>
      </div>
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        searchPlaceholder="Buscar por nome ou email..."
        searchFilter={(r, q) => (r.full_name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q)}
      />
    </div>
  );
}

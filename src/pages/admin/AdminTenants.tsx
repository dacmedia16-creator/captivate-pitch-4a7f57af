import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
}

export default function AdminTenants() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", status: "active" });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
      return (data || []) as Tenant[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (vals: typeof form & { id?: string }) => {
      if (vals.id) {
        const { error } = await supabase.from("tenants").update({ name: vals.name, slug: vals.slug, status: vals.status }).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("tenants").insert({ name: vals.name, slug: vals.slug, status: vals.status }).select().single();
        if (error) throw error;
        // Create agency_profiles record
        await supabase.from("agency_profiles").insert({ tenant_id: data.id, company_name: vals.name });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(editing ? "Imobiliária atualizada!" : "Imobiliária criada!");
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async (t: Tenant) => {
      const newStatus = t.status === "active" ? "blocked" : "active";
      const { error } = await supabase.from("tenants").update({ status: newStatus }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Status atualizado!");
      setConfirmToggle(null);
    },
  });

  const openCreate = () => { setEditing(null); setForm({ name: "", slug: "", status: "active" }); setModalOpen(true); };
  const openEdit = (t: Tenant) => { setEditing(t); setForm({ name: t.name, slug: t.slug, status: t.status }); setModalOpen(true); };

  const columns: Column<Tenant>[] = [
    { key: "name", header: "Nome", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "slug", header: "Slug", render: (r) => <span className="text-muted-foreground text-sm">{r.slug}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "created", header: "Criado em", render: (r) => <span className="text-sm text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</span> },
    {
      key: "actions", header: "Ações", render: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setConfirmToggle(r)}>
            {r.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Imobiliárias</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as imobiliárias da plataforma</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        loading={isLoading}
        searchPlaceholder="Buscar imobiliária..."
        searchFilter={(r, q) => r.name.toLowerCase().includes(q)}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Imobiliária</Button>}
      />

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Imobiliária" : "Nova Imobiliária"}>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...form, id: editing?.id }); }}
        >
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!confirmToggle}
        onOpenChange={() => setConfirmToggle(null)}
        title={confirmToggle?.status === "active" ? "Bloquear Imobiliária?" : "Ativar Imobiliária?"}
        description={`Deseja ${confirmToggle?.status === "active" ? "bloquear" : "ativar"} a imobiliária "${confirmToggle?.name}"?`}
        onConfirm={() => confirmToggle && toggleMutation.mutate(confirmToggle)}
        confirmLabel={confirmToggle?.status === "active" ? "Bloquear" : "Ativar"}
        destructive={confirmToggle?.status === "active"}
      />
    </div>
  );
}

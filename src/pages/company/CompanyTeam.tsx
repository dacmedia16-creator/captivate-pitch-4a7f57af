import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BrokerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  creci?: string | null;
  short_bio?: string | null;
  years_in_market?: number | null;
  education?: string | null;
  specialties?: string | null;
  service_regions?: string | null;
  vgv_summary?: string | null;
  preferred_tone?: string | null;
  preferred_layout?: string | null;
}

const defaultForm = {
  full_name: "", email: "", phone: "", creci: "", short_bio: "",
  years_in_market: "", education: "", specialties: "", service_regions: "",
  vgv_summary: "", preferred_tone: "", preferred_layout: "",
};

export default function CompanyTeam() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BrokerRow | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: brokers = [], isLoading } = useQuery({
    queryKey: ["company-team", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (!profiles) return [];

      const ids = profiles.map((p) => p.id);
      const { data: bps } = await supabase.from("broker_profiles").select("*").in("user_id", ids);
      const bpMap = new Map((bps || []).map((b) => [b.user_id, b]));

      return profiles.map((p): BrokerRow => ({ ...p, ...bpMap.get(p.id) }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (vals: typeof form & { id?: string }) => {
      if (vals.id) {
        await supabase.from("profiles").update({
          full_name: vals.full_name, phone: vals.phone,
        }).eq("id", vals.id);
        const { data: existing } = await supabase.from("broker_profiles").select("id").eq("user_id", vals.id).maybeSingle();
        const bp = {
          creci: vals.creci, short_bio: vals.short_bio,
          years_in_market: vals.years_in_market ? parseInt(vals.years_in_market) : null,
          education: vals.education, specialties: vals.specialties,
          service_regions: vals.service_regions, vgv_summary: vals.vgv_summary,
          preferred_tone: vals.preferred_tone, preferred_layout: vals.preferred_layout,
        };
        if (existing) {
          await supabase.from("broker_profiles").update(bp).eq("user_id", vals.id);
        } else {
          await supabase.from("broker_profiles").insert({ ...bp, user_id: vals.id });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-team"] });
      toast.success("Corretor atualizado!");
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (b: BrokerRow) => {
    setEditing(b);
    setForm({
      full_name: b.full_name || "", email: b.email || "", phone: b.phone || "",
      creci: b.creci || "", short_bio: b.short_bio || "",
      years_in_market: b.years_in_market?.toString() || "",
      education: b.education || "", specialties: b.specialties || "",
      service_regions: b.service_regions || "", vgv_summary: b.vgv_summary || "",
      preferred_tone: b.preferred_tone || "", preferred_layout: b.preferred_layout || "",
    });
    setModalOpen(true);
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const columns: Column<BrokerRow>[] = [
    {
      key: "name", header: "Corretor", render: (r) => (
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
    { key: "phone", header: "Telefone", render: (r) => <span className="text-sm">{r.phone || "—"}</span> },
    { key: "creci", header: "CRECI", render: (r) => <span className="text-sm">{r.creci || "—"}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "created", header: "Cadastro", render: (r) => <span className="text-sm text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</span> },
    {
      key: "actions", header: "", render: (r) => (
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="text-muted-foreground mt-1">Gerencie os corretores da sua imobiliária</p>
      </div>

      <DataTable
        columns={columns}
        data={brokers}
        loading={isLoading}
        searchPlaceholder="Buscar corretor..."
        searchFilter={(r, q) => (r.full_name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q)}
      />

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="Editar Corretor">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...form, id: editing?.id }); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>CRECI</Label><Input value={form.creci} onChange={(e) => set("creci", e.target.value)} /></div>
            <div className="space-y-2"><Label>Tempo de mercado (anos)</Label><Input type="number" value={form.years_in_market} onChange={(e) => set("years_in_market", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Bio curta</Label><Textarea value={form.short_bio} onChange={(e) => set("short_bio", e.target.value)} rows={2} /></div>
          <div className="space-y-2"><Label>Formação</Label><Input value={form.education} onChange={(e) => set("education", e.target.value)} /></div>
          <div className="space-y-2"><Label>Especialidades</Label><Input value={form.specialties} onChange={(e) => set("specialties", e.target.value)} /></div>
          <div className="space-y-2"><Label>Regiões de atuação</Label><Input value={form.service_regions} onChange={(e) => set("service_regions", e.target.value)} /></div>
          <div className="space-y-2"><Label>Resumo VGV</Label><Textarea value={form.vgv_summary} onChange={(e) => set("vgv_summary", e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Tom preferido</Label><Input value={form.preferred_tone} onChange={(e) => set("preferred_tone", e.target.value)} /></div>
            <div className="space-y-2"><Label>Layout preferido</Label><Input value={form.preferred_layout} onChange={(e) => set("preferred_layout", e.target.value)} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </FormModal>
    </div>
  );
}

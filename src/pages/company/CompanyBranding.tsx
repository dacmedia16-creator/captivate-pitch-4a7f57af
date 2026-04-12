import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export default function CompanyBranding() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const qc = useQueryClient();

  // Agency profile
  const { data: agency } = useQuery({
    queryKey: ["agency-profile", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("agency_profiles").select("*").eq("tenant_id", tenantId!).maybeSingle();
      return data;
    },
  });

  const [agencyForm, setAgencyForm] = useState({
    company_name: "", logo_url: "" as string | null, branch_photo_url: "" as string | null,
    primary_color: "#1e3a5f", secondary_color: "#c9a84c",
    about_global: "", about_national: "", about_regional: "", regional_numbers: "",
  });

  useEffect(() => {
    if (agency) {
      setAgencyForm({
        company_name: agency.company_name || "",
        logo_url: agency.logo_url,
        branch_photo_url: agency.branch_photo_url,
        primary_color: agency.primary_color || "#1e3a5f",
        secondary_color: agency.secondary_color || "#c9a84c",
        about_global: agency.about_global || "",
        about_national: agency.about_national || "",
        about_regional: agency.about_regional || "",
        regional_numbers: agency.regional_numbers || "",
      });
    }
  }, [agency]);

  const saveAgency = useMutation({
    mutationFn: async () => {
      if (!tenantId) return;
      const { error } = await supabase.from("agency_profiles").update(agencyForm).eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agency-profile"] }); toast.success("Dados salvos!"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Differentials CRUD
  const { data: differentials = [] } = useQuery({
    queryKey: ["differentials", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("competitive_differentials").select("*").eq("tenant_id", tenantId!).order("sort_order");
      return data || [];
    },
  });

  // Sales Results CRUD
  const { data: salesResults = [] } = useQuery({
    queryKey: ["sales-results", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("sales_results").select("*").eq("tenant_id", tenantId!).order("sort_order");
      return data || [];
    },
  });

  // Testimonials CRUD
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("testimonials").select("*").eq("tenant_id", tenantId!).order("sort_order");
      return data || [];
    },
  });

  const set = (k: string, v: any) => setAgencyForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marca e Personalização</h1>
        <p className="text-muted-foreground mt-1">Configure a identidade visual e conteúdos institucionais</p>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="global">Mundial</TabsTrigger>
          <TabsTrigger value="nacional">Nacional</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="diferenciais">Diferenciais</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="depoimentos">Depoimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardHeader><CardTitle className="font-sans text-lg">Dados da Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Nome da empresa</Label><Input value={agencyForm.company_name} onChange={(e) => set("company_name", e.target.value)} /></div>
              <div className="space-y-2"><Label>Logo</Label><ImageUploader value={agencyForm.logo_url} onChange={(v) => set("logo_url", v)} folder="logos" /></div>
              <div className="space-y-2"><Label>Foto da agência</Label><ImageUploader value={agencyForm.branch_photo_url} onChange={(v) => set("branch_photo_url", v)} folder="agency" /></div>
              <Button onClick={() => saveAgency.mutate()} disabled={saveAgency.isPending}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader><CardTitle className="font-sans text-lg">Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor principal</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={agencyForm.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                    <Input value={agencyForm.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor secundária</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={agencyForm.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                    <Input value={agencyForm.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-lg border" style={{ background: `linear-gradient(135deg, ${agencyForm.primary_color}, ${agencyForm.secondary_color})` }}>
                <p className="text-white font-bold text-lg">Preview da identidade visual</p>
                <p className="text-white/80 text-sm">{agencyForm.company_name || "Sua Imobiliária"}</p>
              </div>
              <Button onClick={() => saveAgency.mutate()} disabled={saveAgency.isPending}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global">
          <Card>
            <CardHeader><CardTitle className="font-sans text-lg">Apresentação Mundial</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={agencyForm.about_global} onChange={(e) => set("about_global", e.target.value)} rows={8} placeholder="Conteúdo institucional global..." />
              <Button onClick={() => saveAgency.mutate()} disabled={saveAgency.isPending}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nacional">
          <Card>
            <CardHeader><CardTitle className="font-sans text-lg">Apresentação Nacional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={agencyForm.about_national} onChange={(e) => set("about_national", e.target.value)} rows={8} placeholder="Conteúdo institucional nacional..." />
              <Button onClick={() => saveAgency.mutate()} disabled={saveAgency.isPending}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional">
          <Card>
            <CardHeader><CardTitle className="font-sans text-lg">Apresentação Regional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={agencyForm.about_regional} onChange={(e) => set("about_regional", e.target.value)} rows={6} placeholder="Conteúdo regional..." />
              <div className="space-y-2"><Label>Números regionais</Label><Textarea value={agencyForm.regional_numbers} onChange={(e) => set("regional_numbers", e.target.value)} rows={4} placeholder="Dados e métricas regionais..." /></div>
              <Button onClick={() => saveAgency.mutate()} disabled={saveAgency.isPending}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diferenciais">
          <CrudSection
            title="Diferenciais Competitivos"
            items={differentials}
            tenantId={tenantId}
            table="competitive_differentials"
            fields={["title", "description"]}
            fieldLabels={{ title: "Título", description: "Descrição" }}
            queryKey="differentials"
          />
        </TabsContent>

        <TabsContent value="resultados">
          <CrudSection
            title="Resultados de Vendas"
            items={salesResults}
            tenantId={tenantId}
            table="sales_results"
            fields={["title", "description", "metric_value"]}
            fieldLabels={{ title: "Título", description: "Descrição", metric_value: "Indicador" }}
            queryKey="sales-results"
          />
        </TabsContent>

        <TabsContent value="depoimentos">
          <CrudSection
            title="Depoimentos"
            items={testimonials}
            tenantId={tenantId}
            table="testimonials"
            fields={["author_name", "author_role", "content"]}
            fieldLabels={{ author_name: "Nome", author_role: "Cargo", content: "Depoimento" }}
            queryKey="testimonials"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Generic CRUD section component
function CrudSection({ title, items, tenantId, table, fields, fieldLabels, queryKey }: {
  title: string;
  items: any[];
  tenantId: string | null | undefined;
  table: string;
  fields: string[];
  fieldLabels: Record<string, string>;
  queryKey: string;
}) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const openCreate = () => {
    setEditing(null);
    const empty: Record<string, string> = {};
    fields.forEach((f) => (empty[f] = ""));
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const filled: Record<string, string> = {};
    fields.forEach((f) => (filled[f] = item[f] || ""));
    setForm(filled);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from(table as any).update(form as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert({ ...form, tenant_id: tenantId, sort_order: items.length } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); toast.success("Salvo!"); setModalOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); toast.success("Removido!"); setDeleteTarget(null); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-sans text-lg">{title}</CardTitle>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Nenhum item cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{item[fields[0]]}</p>
                  {fields[1] && <p className="text-xs text-muted-foreground">{item[fields[1]]}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? `Editar ${title}` : `Novo ${title}`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          {fields.map((f) => (
            <div key={f} className="space-y-2">
              <Label>{fieldLabels[f] || f}</Label>
              {f === "content" || f === "description" ? (
                <Textarea value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} rows={3} />
              ) : (
                <Input value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>Salvar</Button>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Excluir item?"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        confirmLabel="Excluir"
        destructive
      />
    </Card>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PlusCircle, Pencil, Trash2, Copy, Loader2, Presentation as PresentationIcon, BookTemplate } from "lucide-react";
import { toast } from "sonner";

export default function AgentPresentations() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: presentations, isLoading } = useQuery({
    queryKey: ["agent-presentations", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("presentations").select("*").eq("broker_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: templates } = useQuery({
    queryKey: ["agent-templates", profile?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase.from("presentation_templates").select("*").eq("tenant_id", profile!.tenant_id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("presentation_sections").delete().eq("presentation_id", id);
      await supabase.from("presentation_images").delete().eq("presentation_id", id);
      const { error } = await supabase.from("presentations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Apresentação excluída"); queryClient.invalidateQueries({ queryKey: ["agent-presentations"] }); setDeleteId(null); },
    onError: () => toast.error("Erro ao excluir"),
  });

  const useTemplate = async (template: any) => {
    if (!user || !profile?.tenant_id) return;
    const { data: pres, error } = await supabase.from("presentations").insert({
      tenant_id: profile.tenant_id,
      broker_id: user.id,
      title: `${template.name} (a partir de modelo)`,
      selected_layout: template.layout,
      share_token: crypto.randomUUID(),
      status: "draft",
    }).select().single();
    if (error || !pres) { toast.error("Erro ao criar"); return; }

    const structure = template.structure as any[];
    if (structure?.length) {
      const sections = structure.map((s: any) => ({
        presentation_id: pres.id,
        section_key: s.section_key,
        title: s.title,
        content: s.content,
        sort_order: s.sort_order,
        is_visible: s.is_visible ?? true,
      }));
      await supabase.from("presentation_sections").insert(sections);
    }

    toast.success("Apresentação criada a partir do modelo!");
    navigate(`/presentations/${pres.id}/edit`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Apresentações</h1>
          <p className="text-muted-foreground">Visualize, edite e compartilhe suas apresentações.</p>
        </div>
        <Button onClick={() => navigate("/presentations/new")} className="gold-gradient text-primary-foreground">
          <PlusCircle className="h-4 w-4 mr-2" /> Nova
        </Button>
      </div>

      <Tabs defaultValue="presentations">
        <TabsList>
          <TabsTrigger value="presentations"><PresentationIcon className="h-4 w-4 mr-1" /> Apresentações</TabsTrigger>
          <TabsTrigger value="templates"><BookTemplate className="h-4 w-4 mr-1" /> Modelos</TabsTrigger>
        </TabsList>

        <TabsContent value="presentations" className="mt-4">
          {presentations?.length ? (
            <div className="grid gap-4">
              {presentations.map(p => (
                <Card key={p.id} className="glass-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/presentations/${p.id}/edit`)}>
                      <h3 className="font-semibold">{p.title || "Sem título"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {[p.property_type, p.neighborhood, p.city].filter(Boolean).join(" • ")} — {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/presentations/${p.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma apresentação criada ainda.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          {templates?.length ? (
            <div className="grid gap-4">
              {templates.map(t => (
                <Card key={t.id} className="glass-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">Layout: {t.layout || "padrão"}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => useTemplate(t)}>
                      <Copy className="h-4 w-4 mr-1" /> Usar modelo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card"><CardContent className="p-8 text-center text-muted-foreground">Nenhum modelo salvo. Salve uma apresentação como modelo no editor.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir apresentação"
        description="Esta ação não pode ser desfeita."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        destructive
      />
    </div>
  );
}

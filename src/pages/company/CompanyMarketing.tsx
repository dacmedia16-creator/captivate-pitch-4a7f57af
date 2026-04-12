import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, GripVertical, Camera, Video, Globe, FileText, Users, Megaphone, Home, MessageSquare, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const iconOptions = [
  { value: "camera", label: "Câmera", icon: Camera },
  { value: "video", label: "Vídeo", icon: Video },
  { value: "globe", label: "Globe", icon: Globe },
  { value: "file-text", label: "Documento", icon: FileText },
  { value: "users", label: "Pessoas", icon: Users },
  { value: "megaphone", label: "Megafone", icon: Megaphone },
  { value: "home", label: "Casa", icon: Home },
  { value: "message", label: "Mensagem", icon: MessageSquare },
  { value: "calendar", label: "Calendário", icon: Calendar },
  { value: "chart", label: "Gráfico", icon: BarChart3 },
];

export default function CompanyMarketing() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", icon: "camera", image_url: null as string | null, is_active: true });

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["marketing-actions", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data } = await supabase.from("marketing_actions").select("*").eq("tenant_id", tenantId!).order("sort_order");
      return data || [];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", icon: "camera", image_url: null, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ title: item.title, description: item.description || "", icon: item.icon || "camera", image_url: item.image_url, is_active: item.is_active });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("marketing_actions").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marketing_actions").insert({ ...form, tenant_id: tenantId!, sort_order: actions.length });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["marketing-actions"] }); toast.success("Salvo!"); setModalOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_actions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["marketing-actions"] }); toast.success("Removido!"); setDeleteTarget(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("marketing_actions").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing-actions"] }),
  });

  const getIcon = (iconName: string) => {
    const found = iconOptions.find((o) => o.value === iconName);
    return found ? found.icon : Camera;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plano de Marketing</h1>
          <p className="text-muted-foreground mt-1">Configure as ações de marketing padrão da imobiliária</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Ação</Button>
      </div>

      {actions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma ação cadastrada.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => {
            const IconComp = getIcon(action.icon || "camera");
            return (
              <Card key={action.id} className={`transition-opacity ${!action.is_active ? "opacity-50" : ""}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                    <IconComp className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={action.is_active} onCheckedChange={(v) => toggleMutation.mutate({ id: action.id, is_active: v })} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(action)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(action)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <FormModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Ação" : "Nova Ação"}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="space-y-2">
            <Label>Ícone</Label>
            <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {iconOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Imagem</Label><ImageUploader value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} folder="marketing" /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label>Ativo</Label>
          </div>
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>Salvar</Button>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Excluir ação?"
        description={`Deseja excluir "${deleteTarget?.title}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}

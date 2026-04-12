import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SlidesSidebar } from "@/components/editor/SlidesSidebar";
import { EditPanel } from "@/components/editor/EditPanel";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { SectionRenderer, SectionData } from "@/components/layouts/SectionRenderer";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/hooks/useAuditLog";

export default function PresentationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState<SectionData[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const userId = profile?.id;
  const tenantId = profile?.tenant_id;

  const { data: presentation, isLoading: loadingPres } = useQuery({
    queryKey: ["presentation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentations").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: branding } = useQuery({
    queryKey: ["agency-branding", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("agency_profiles").select("primary_color, secondary_color, logo_url").eq("tenant_id", tenantId!).single();
      return data;
    },
    enabled: !!tenantId,
  });

  const { isLoading: loadingSections } = useQuery({
    queryKey: ["presentation-sections", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("presentation_sections").select("*").eq("presentation_id", id!).order("sort_order");
      if (error) throw error;
      const mapped = (data || []).map(s => ({ ...s, content: s.content as any })) as SectionData[];
      setLocalSections(mapped);
      if (mapped.length > 0 && !selectedId) setSelectedId(mapped[0].id);
      return mapped;
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        localSections.map(s =>
          supabase.from("presentation_sections").update({ content: s.content as any, title: s.title, is_visible: s.is_visible, sort_order: s.sort_order }).eq("id", s.id)
        )
      );
      await logAudit("presentation_saved", "presentation", id!, undefined, userId, tenantId);
    },
    onSuccess: () => { toast.success("Salvo!"); queryClient.invalidateQueries({ queryKey: ["presentation-sections", id] }); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const handleUpdate = useCallback((sectionId: string, content: any, title: string | null) => {
    setLocalSections(prev => prev.map(s => s.id === sectionId ? { ...s, content, title } : s));
  }, []);

  const toggleVisibility = useCallback((sectionId: string) => {
    setLocalSections(prev => prev.map(s => s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s));
  }, []);

  const handleDuplicate = async () => {
    if (!presentation) return;
    const { data: newPres, error } = await supabase.from("presentations").insert({
      ...presentation, id: undefined, title: (presentation.title || "Apresentação") + " (cópia)",
      share_token: crypto.randomUUID(), created_at: undefined, updated_at: undefined,
    } as any).select().single();
    if (error || !newPres) { toast.error("Erro ao duplicar"); return; }
    const newSections = localSections.map(s => ({ ...s, id: undefined, presentation_id: newPres.id, created_at: undefined, updated_at: undefined }));
    await supabase.from("presentation_sections").insert(newSections as any);
    await logAudit("presentation_duplicated", "presentation", newPres.id, undefined, userId, tenantId);
    toast.success("Apresentação duplicada!");
    navigate(`/presentations/${newPres.id}/edit`);
  };

  const handleSaveAsTemplate = async () => {
    if (!presentation || !tenantId) return;
    await supabase.from("presentation_templates").insert({
      tenant_id: tenantId, broker_id: userId, name: presentation.title || "Modelo sem nome",
      layout: presentation.selected_layout,
      structure: localSections.map(s => ({ section_key: s.section_key, title: s.title, content: s.content, sort_order: s.sort_order, is_visible: s.is_visible })) as any,
    });
    toast.success("Modelo salvo!");
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-presentation-text", { body: { presentation_id: id } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      await logAudit("ai_text_generated", "presentation", id!, undefined, userId, tenantId);
      queryClient.invalidateQueries({ queryKey: ["presentation-sections", id] });
      toast.success("Textos gerados com IA!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar textos");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-pdf", { body: { presentation_id: id } });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        await logAudit("pdf_exported", "presentation", id!, undefined, userId, tenantId);
        toast.success("PDF exportado!");
      } else { toast.error(data?.error || "Erro ao exportar"); }
    } catch (e: any) {
      toast.error(e.message || "Erro ao exportar PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  if (loadingPres || loadingSections) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selected = localSections.find(s => s.id === selectedId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <EditorToolbar
        presentationId={id!} shareToken={presentation?.share_token || null}
        onSaveAsTemplate={handleSaveAsTemplate} onDuplicate={handleDuplicate}
        onPresent={() => navigate(`/presentations/${id}/present`)}
        onSave={() => saveMutation.mutate()} saving={saveMutation.isPending}
        onGenerateAI={handleGenerateAI} generatingAI={generatingAI}
        onExportPDF={handleExportPDF} exportingPDF={exportingPDF}
      />
      <div className="flex flex-1 overflow-hidden">
        <SlidesSidebar sections={localSections} selectedId={selectedId} onSelect={setSelectedId} onToggleVisibility={toggleVisibility} />
        <div className="flex-1 overflow-y-auto subtle-grid-bg p-8 flex items-start justify-center">
          <div className="w-full max-w-3xl slide-frame rounded-xl bg-white">
            {selected ? (
              <SectionRenderer section={selected} layout={presentation?.selected_layout || "executivo"} branding={branding || undefined} />
            ) : (
              <p className="text-muted-foreground text-center p-12">Nenhum slide selecionado</p>
            )}
          </div>
        </div>
        <EditPanel section={selected} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
